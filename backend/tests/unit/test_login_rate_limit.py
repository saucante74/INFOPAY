"""Unit tests for `app.auth.login_rate_limit.LoginRateLimit`, driven by a
fake clock. Functional coverage (through the real `/api/auth/login`
endpoint, with distinct client IPs) lives in tests/functional/test_auth.py."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.auth.login_rate_limit import (
    DEFAULT_LOGIN_RATE_LIMIT,
    LoginRateLimit,
    get_login_rate_limit,
)


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def _hit_expecting_429(limiter: LoginRateLimit, key: str) -> HTTPException:
    with pytest.raises(HTTPException) as excinfo:
        limiter.hit(key)
    assert excinfo.value.status_code == 429
    return excinfo.value


def test_allows_up_to_the_limit_then_rejects():
    limiter = LoginRateLimit(limit=3, window_seconds=900, clock=FakeClock())
    for _ in range(3):
        limiter.hit("1.2.3.4")
    _hit_expecting_429(limiter, "1.2.3.4")


def test_rejection_names_the_limit_and_when_to_retry():
    clock = FakeClock()
    limiter = LoginRateLimit(limit=1, window_seconds=900, clock=clock)
    limiter.hit("1.2.3.4")
    clock.now += 300  # 5 min in, 10 min left in the 15-min window

    error = _hit_expecting_429(limiter, "1.2.3.4")

    assert error.headers == {"Retry-After": "600"}
    assert error.detail == (
        "Trop de tentatives de connexion depuis cette adresse (1 tentative par 15 min). "
        "Réessayez dans 10 min."
    )


def test_different_ips_have_independent_budgets():
    limiter = LoginRateLimit(limit=1, clock=FakeClock())
    limiter.hit("1.2.3.4")
    _hit_expecting_429(limiter, "1.2.3.4")

    limiter.hit("5.6.7.8")  # unaffected by 1.2.3.4's exhausted budget
    _hit_expecting_429(limiter, "5.6.7.8")


def test_window_slides_so_old_attempts_free_up_capacity():
    clock = FakeClock()
    limiter = LoginRateLimit(limit=2, window_seconds=900, clock=clock)
    limiter.hit("1.2.3.4")
    clock.now += 450
    limiter.hit("1.2.3.4")
    _hit_expecting_429(limiter, "1.2.3.4")

    clock.now += 450  # the first attempt is now exactly one window old
    limiter.hit("1.2.3.4")
    _hit_expecting_429(limiter, "1.2.3.4")


def test_rejected_attempts_do_not_consume_capacity():
    clock = FakeClock()
    limiter = LoginRateLimit(limit=1, clock=clock)
    limiter.hit("1.2.3.4")
    for _ in range(5):
        _hit_expecting_429(limiter, "1.2.3.4")
    clock.now += 900
    limiter.hit("1.2.3.4")


def test_reset_clears_every_key():
    limiter = LoginRateLimit(limit=1, clock=FakeClock())
    limiter.hit("1.2.3.4")
    limiter.hit("5.6.7.8")
    limiter.reset()
    limiter.hit("1.2.3.4")
    limiter.hit("5.6.7.8")


def test_limit_defaults_when_env_var_is_absent(monkeypatch):
    monkeypatch.delenv("LOGIN_RATE_LIMIT_PER_15MIN", raising=False)
    assert get_login_rate_limit() == DEFAULT_LOGIN_RATE_LIMIT


def test_limit_is_read_from_env(monkeypatch):
    monkeypatch.setenv("LOGIN_RATE_LIMIT_PER_15MIN", "2")
    assert get_login_rate_limit() == 2
    limiter = LoginRateLimit(clock=FakeClock())
    for _ in range(2):
        limiter.hit("1.2.3.4")
    _hit_expecting_429(limiter, "1.2.3.4")


@pytest.mark.parametrize("value", ["0", "-3", "five", "2.5"])
def test_invalid_limit_is_rejected(monkeypatch, value):
    monkeypatch.setenv("LOGIN_RATE_LIMIT_PER_15MIN", value)
    with pytest.raises(RuntimeError, match="LOGIN_RATE_LIMIT_PER_15MIN"):
        get_login_rate_limit()
