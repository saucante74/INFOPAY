"""Unit tests for `app.auth.security`: settings validation, credential
checks and JWT round-trips. No HTTP here — see tests/functional/test_auth.py."""
from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
import pytest

from app.auth.security import (
    AuthConfigError,
    AuthSettings,
    create_access_token,
    decode_access_token,
    get_auth_settings,
    verify_credentials,
)

VALID_HASH = bcrypt.hashpw(b"pw", bcrypt.gensalt(rounds=4)).decode()
VALID_SECRET = "s" * 40


@pytest.fixture
def auth_env(monkeypatch: pytest.MonkeyPatch):
    """A complete, valid environment; each test breaks one variable."""
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", VALID_HASH)
    monkeypatch.setenv("JWT_SECRET", VALID_SECRET)
    monkeypatch.delenv("JWT_EXPIRE_HOURS", raising=False)
    get_auth_settings.cache_clear()
    yield monkeypatch
    get_auth_settings.cache_clear()


# --- settings -------------------------------------------------------------


def test_settings_load_from_env_with_24h_default(auth_env):
    settings = get_auth_settings()
    assert settings.username == "admin"
    assert settings.password_hash == VALID_HASH.encode()
    assert settings.token_ttl == timedelta(hours=24)


def test_settings_read_custom_token_lifetime(auth_env):
    auth_env.setenv("JWT_EXPIRE_HOURS", "8")
    assert get_auth_settings().token_ttl == timedelta(hours=8)


@pytest.mark.parametrize("name", ["ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "JWT_SECRET"])
def test_settings_fail_loudly_when_a_required_variable_is_missing(auth_env, name):
    auth_env.delenv(name)
    with pytest.raises(AuthConfigError, match=name):
        get_auth_settings()


def test_settings_reject_a_hash_truncated_by_compose_interpolation(auth_env):
    # What an unquoted $2b$12$... becomes after Docker Compose's `$` expansion.
    auth_env.setenv("ADMIN_PASSWORD_HASH", "$2b$12")
    with pytest.raises(AuthConfigError, match="guillemets simples"):
        get_auth_settings()


def test_settings_reject_a_plaintext_password_in_the_hash_variable(auth_env):
    auth_env.setenv("ADMIN_PASSWORD_HASH", "my-password")
    with pytest.raises(AuthConfigError, match="hash bcrypt"):
        get_auth_settings()


def test_settings_reject_a_short_jwt_secret(auth_env):
    auth_env.setenv("JWT_SECRET", "too-short")
    with pytest.raises(AuthConfigError, match="JWT_SECRET"):
        get_auth_settings()


@pytest.mark.parametrize("value", ["0", "-1", "abc", "1.5"])
def test_settings_reject_an_invalid_token_lifetime(auth_env, value):
    auth_env.setenv("JWT_EXPIRE_HOURS", value)
    with pytest.raises(AuthConfigError, match="JWT_EXPIRE_HOURS"):
        get_auth_settings()


# --- credentials ----------------------------------------------------------


def test_verify_credentials_accepts_the_configured_account(auth_settings: AuthSettings, credentials):
    assert verify_credentials(credentials["username"], credentials["password"], auth_settings)


def test_verify_credentials_rejects_a_wrong_password(auth_settings, credentials):
    assert not verify_credentials(credentials["username"], "wrong password", auth_settings)


def test_verify_credentials_rejects_a_wrong_username(auth_settings, credentials):
    assert not verify_credentials("someone-else", credentials["password"], auth_settings)


def test_verify_credentials_rejects_empty_input(auth_settings):
    assert not verify_credentials("", "", auth_settings)


def test_verify_credentials_rejects_an_overlong_password_instead_of_crashing(auth_settings, credentials):
    # bcrypt >= 5 raises ValueError past 72 bytes; that must be a plain
    # "wrong credentials", not a 500.
    assert not verify_credentials(credentials["username"], "x" * 100, auth_settings)


# --- tokens ---------------------------------------------------------------


def test_token_round_trip(auth_settings):
    token = create_access_token(auth_settings.username, auth_settings)
    assert decode_access_token(token, auth_settings) == auth_settings.username


def test_token_carries_the_configured_expiry(auth_settings):
    now = datetime(2026, 1, 1, tzinfo=UTC)
    token = create_access_token(auth_settings.username, auth_settings, now=now)
    claims = jwt.decode(token, options={"verify_signature": False})
    assert claims["exp"] - claims["iat"] == 24 * 3600


def test_expired_token_is_rejected(auth_settings):
    long_ago = datetime.now(UTC) - timedelta(hours=25)
    token = create_access_token(auth_settings.username, auth_settings, now=long_ago)
    assert decode_access_token(token, auth_settings) is None


def test_token_signed_with_another_secret_is_rejected(auth_settings):
    other = replace(auth_settings, jwt_secret="another-secret-" + "y" * 40)
    token = create_access_token(auth_settings.username, other)
    assert decode_access_token(token, auth_settings) is None


def test_unsigned_alg_none_token_is_rejected(auth_settings):
    forged = jwt.encode(
        {"sub": auth_settings.username, "exp": datetime.now(UTC) + timedelta(hours=1)},
        key=None,
        algorithm="none",
    )
    assert decode_access_token(forged, auth_settings) is None


def test_token_for_a_previous_username_is_rejected(auth_settings):
    token = create_access_token("old-admin", auth_settings)
    assert decode_access_token(token, auth_settings) is None


def test_garbage_token_is_rejected(auth_settings):
    assert decode_access_token("not-a-jwt", auth_settings) is None
