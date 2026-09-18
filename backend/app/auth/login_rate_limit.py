"""
Per-IP rate limiting on `POST /api/auth/login`, to slow down password
guessing without a real account-lockout system.

Deliberately **not** `app/rate_limit.py`'s `RateLimit`: that class keeps a
single shared counter, which is correct for `/api/upload` and `/api/chat`
(there is one account, so one Anthropic-cost budget to protect) but wrong
here — a shared counter would let one attacker lock out the legitimate
user by exhausting it. `LoginRateLimit` keeps one counter per client IP
instead, so addresses are independent of each other.

Lives under `app/auth/` rather than in `app/rate_limit.py`: brute-force
protection is specifically an authentication concern, not a generic
cost-protection primitive — see CLAUDE.md, "Authentication and rate
limiting".
"""
import math
import os
import threading
import time
from collections import deque
from collections.abc import Callable

from fastapi import HTTPException, Request, status

DEFAULT_LOGIN_RATE_LIMIT = 5
WINDOW_SECONDS = 900.0  # 15 minutes


def get_login_rate_limit() -> int:
    raw = os.environ.get("LOGIN_RATE_LIMIT_PER_15MIN", "").strip()
    if not raw:
        return DEFAULT_LOGIN_RATE_LIMIT
    if not raw.isdigit() or int(raw) == 0:
        raise RuntimeError(
            f"LOGIN_RATE_LIMIT_PER_15MIN doit être un entier positif (reçu : {raw!r})."
        )
    return int(raw)


class LoginRateLimit:
    """Sliding-window limiter with one independent counter per key (the
    client IP in practice). `limit=None` reads `LOGIN_RATE_LIMIT_PER_15MIN`
    on each call; tests pass an explicit limit and clock instead."""

    def __init__(
        self,
        limit: int | None = None,
        window_seconds: float = WINDOW_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._limit = limit
        self._window = window_seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        # Sync dependencies run in FastAPI's threadpool, so concurrent
        # requests (from different IPs, or the same one) can land here at
        # the same time.
        self._lock = threading.Lock()

    def hit(self, key: str) -> None:
        limit = self._limit if self._limit is not None else get_login_rate_limit()
        with self._lock:
            now = self._clock()
            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= now - self._window:
                hits.popleft()
            if len(hits) >= limit:
                retry_after = max(1, math.ceil(hits[0] + self._window - now))
                attempts = "tentative" if limit == 1 else "tentatives"
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Trop de tentatives de connexion depuis cette adresse "
                        f"({limit} {attempts} par {int(self._window // 60)} min). "
                        f"Réessayez dans {math.ceil(retry_after / 60)} min."
                    ),
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


login_rate_limit = LoginRateLimit()


def require_login_rate_limit(request: Request) -> None:
    """FastAPI dependency: keys `login_rate_limit` by the caller's IP.

    `request.client` can be `None` for some ASGI transports (never for
    uvicorn's real HTTP server); such requests all share one bucket rather
    than crashing the request.
    """
    key = request.client.host if request.client else "unknown"
    login_rate_limit.hit(key)
