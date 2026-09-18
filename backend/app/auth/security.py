"""
Credentials, JWT issuing/verification, and the `require_auth` dependency.

The single account lives in environment variables, not in a table:
`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (a bcrypt hash, never the password
itself) and `JWT_SECRET`. See README.md, "Authentication", for how to
generate them.

`bcrypt` is used directly rather than through passlib: passlib 1.7.4 (its
last release, 2020) fails on its very first hash with bcrypt >= 5, which
chromadb already pulls into this environment.
"""
import hmac
import os
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_ALGORITHM = "HS256"
DEFAULT_TOKEN_TTL_HOURS = 24
MIN_JWT_SECRET_LENGTH = 32
BCRYPT_HASH_LENGTH = 60


class AuthConfigError(RuntimeError):
    """Authentication is misconfigured; raised at startup, not per request."""


@dataclass(frozen=True)
class AuthSettings:
    username: str
    password_hash: bytes
    jwt_secret: str
    token_ttl: timedelta


def _required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise AuthConfigError(f"{name} n'est pas défini — voir README.md, section « Authentication ».")
    return value


def _token_ttl_from_env() -> timedelta:
    raw = os.environ.get("JWT_EXPIRE_HOURS", "").strip()
    if not raw:
        return timedelta(hours=DEFAULT_TOKEN_TTL_HOURS)
    if not raw.isdigit() or int(raw) == 0:
        raise AuthConfigError(f"JWT_EXPIRE_HOURS doit être un entier positif (reçu : {raw!r}).")
    return timedelta(hours=int(raw))


@lru_cache(maxsize=1)
def get_auth_settings() -> AuthSettings:
    password_hash = _required_env("ADMIN_PASSWORD_HASH")
    # Docker Compose interpolates `$` in env_file values: an unquoted hash
    # like $2b$12$abc... reaches the container as just "$2b$12". Checking
    # the shape turns that silent "every login fails" into a startup error.
    if len(password_hash) != BCRYPT_HASH_LENGTH or not password_hash.startswith("$2"):
        raise AuthConfigError(
            "ADMIN_PASSWORD_HASH n'est pas un hash bcrypt complet (60 caractères, commençant "
            "par $2). Dans backend/.env, entourez-le de guillemets simples : "
            "ADMIN_PASSWORD_HASH='$2b$12$...'."
        )

    jwt_secret = _required_env("JWT_SECRET")
    if len(jwt_secret) < MIN_JWT_SECRET_LENGTH:
        raise AuthConfigError(
            f"JWT_SECRET doit faire au moins {MIN_JWT_SECRET_LENGTH} caractères."
        )

    return AuthSettings(
        username=_required_env("ADMIN_USERNAME"),
        password_hash=password_hash.encode(),
        jwt_secret=jwt_secret,
        token_ttl=_token_ttl_from_env(),
    )


def verify_credentials(username: str, password: str, settings: AuthSettings) -> bool:
    # Both checks always run, so a wrong username takes as long as a wrong
    # password and response time doesn't reveal which one was wrong.
    username_ok = hmac.compare_digest(username.encode(), settings.username.encode())
    try:
        password_ok = bcrypt.checkpw(password.encode(), settings.password_hash)
    except ValueError:
        # bcrypt >= 5 rejects passwords over 72 bytes instead of truncating.
        password_ok = False
    return username_ok and password_ok


def create_access_token(
    username: str, settings: AuthSettings, now: datetime | None = None
) -> str:
    issued_at = now or datetime.now(UTC)
    payload = {"sub": username, "iat": issued_at, "exp": issued_at + settings.token_ttl}
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str, settings: AuthSettings) -> str | None:
    """The token's username if it is valid, unexpired and for the current
    account; `None` otherwise. Pinning `algorithms` rejects `alg: none`."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    subject = payload.get("sub")
    # Changing ADMIN_USERNAME invalidates tokens issued to the old name.
    return subject if subject == settings.username else None


# auto_error=False: FastAPI's default for a missing header is a 403, but a
# missing credential is a 401 (RFC 9110 §15.5.2). Raised below instead.
_bearer_scheme = HTTPBearer(auto_error=False)


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    settings: Annotated[AuthSettings, Depends(get_auth_settings)],
) -> str:
    """Router-level dependency: the authenticated username, or a 401."""
    username = decode_access_token(credentials.credentials, settings) if credentials else None
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise ou session expirée.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username
