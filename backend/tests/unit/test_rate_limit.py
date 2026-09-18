"""Unit tests for `app.rate_limit.RateLimit`, driven by a fake clock so the
sliding window is tested without sleeping."""
from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi import HTTPException

from app.rate_limit import DEFAULT_LIMIT_PER_HOUR, RateLimit, get_rate_limit_per_hour


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def _call_expecting_429(limiter: RateLimit) -> HTTPException:
    with pytest.raises(HTTPException) as excinfo:
        limiter()
    assert excinfo.value.status_code == 429
    return excinfo.value


def test_allows_up_to_the_limit_then_rejects():
    limiter = RateLimit("test", limit=3, window_seconds=3600, clock=FakeClock())
    for _ in range(3):
        limiter()
    _call_expecting_429(limiter)


def test_rejection_tells_the_client_when_to_retry():
    clock = FakeClock()
    limiter = RateLimit("test", limit=1, window_seconds=3600, clock=clock)
    limiter()
    clock.now += 600

    error = _call_expecting_429(limiter)

    assert error.headers == {"Retry-After": "3000"}
    assert error.detail == "Limite atteinte (1 requête par heure). Réessayez dans 50 min."


def test_window_slides_so_old_requests_free_up_capacity():
    clock = FakeClock()
    limiter = RateLimit("test", limit=2, window_seconds=3600, clock=clock)
    limiter()
    clock.now += 1800
    limiter()
    _call_expecting_429(limiter)

    clock.now += 1800  # the first request is now exactly one window old
    limiter()
    _call_expecting_429(limiter)


def test_rejected_requests_do_not_consume_capacity():
    clock = FakeClock()
    limiter = RateLimit("test", limit=1, window_seconds=3600, clock=clock)
    limiter()
    for _ in range(5):
        _call_expecting_429(limiter)
    clock.now += 3600
    limiter()


def test_limiters_are_independent():
    upload = RateLimit("upload", limit=1, clock=FakeClock())
    chat = RateLimit("chat", limit=1, clock=FakeClock())
    upload()
    chat()
    _call_expecting_429(upload)


def test_reset_clears_the_window():
    limiter = RateLimit("test", limit=1, clock=FakeClock())
    limiter()
    limiter.reset()
    limiter()


def test_limit_defaults_when_env_var_is_absent(monkeypatch):
    monkeypatch.delenv("RATE_LIMIT_PER_HOUR", raising=False)
    assert get_rate_limit_per_hour() == DEFAULT_LIMIT_PER_HOUR


def test_limit_is_read_from_env(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_HOUR", "5")
    assert get_rate_limit_per_hour() == 5
    limiter = RateLimit("test", clock=FakeClock())
    for _ in range(5):
        limiter()
    _call_expecting_429(limiter)


@pytest.mark.parametrize("value", ["0", "-3", "twenty", "2.5"])
def test_invalid_limit_is_rejected(monkeypatch, value):
    monkeypatch.setenv("RATE_LIMIT_PER_HOUR", value)
    with pytest.raises(RuntimeError, match="RATE_LIMIT_PER_HOUR"):
        get_rate_limit_per_hour()


# --- remaining() / limit() / reset_at() ------------------------------------
# Added for GET /api/rate-limits: these read the same in-memory `_hits`
# `__call__` already maintains, so there's no second source of truth to
# keep in sync.


def test_remaining_starts_at_the_full_limit():
    limiter = RateLimit("test", limit=3, clock=FakeClock())
    assert limiter.remaining() == 3


def test_remaining_decreases_with_each_call_and_floors_at_zero():
    limiter = RateLimit("test", limit=2, clock=FakeClock())
    limiter()
    assert limiter.remaining() == 1
    limiter()
    assert limiter.remaining() == 0
    _call_expecting_429(limiter)
    assert limiter.remaining() == 0  # a rejected call doesn't go negative


def test_remaining_does_not_itself_consume_capacity():
    limiter = RateLimit("test", limit=1, clock=FakeClock())
    limiter.remaining()
    limiter.remaining()
    limiter()  # still allowed: reading remaining() twice used no slot


def test_remaining_recovers_as_the_window_slides():
    clock = FakeClock()
    limiter = RateLimit("test", limit=1, window_seconds=3600, clock=clock)
    limiter()
    assert limiter.remaining() == 0
    clock.now += 3600
    assert limiter.remaining() == 1


def test_limit_reads_the_env_var_when_not_fixed_at_construction(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_HOUR", "7")
    limiter = RateLimit("test", clock=FakeClock())
    assert limiter.limit() == 7


def test_reset_at_is_now_when_the_window_is_empty():
    limiter = RateLimit("test", limit=1, clock=FakeClock())
    before = datetime.now(UTC)
    reset_at = limiter.reset_at()
    after = datetime.now(UTC)
    assert before <= reset_at <= after


def test_reset_at_tracks_the_oldest_hit_expiring():
    clock = FakeClock()
    limiter = RateLimit("test", limit=1, window_seconds=3600, clock=clock)
    limiter()

    delta_now = (limiter.reset_at() - datetime.now(UTC)).total_seconds()
    assert 3590 < delta_now <= 3600

    clock.now += 1800  # halfway through the window
    delta_later = (limiter.reset_at() - datetime.now(UTC)).total_seconds()
    assert 1790 < delta_later <= 1800
