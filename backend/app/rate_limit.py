"""
In-memory rate limiting for the endpoints that spend Anthropic credits
(`/api/upload`, `/api/chat`).

A plain FastAPI dependency rather than slowapi: slowapi needs a decorator
on each route plus a `request: Request` parameter in its signature, which
would thread the limiter through business code. This only adds
`dependencies=[Depends(...)]` to the two route decorators.

Independent of `app/auth` on purpose: removing authentication shouldn't
remove cost protection. Counters are per endpoint, not per user. There is
one account, and the budget being protected (the Anthropic API key) is
global anyway.

Per-process by design: counters reset on restart, and N uvicorn workers
would allow N times the limit. Both are fine here (the Dockerfile runs a
single worker). If that stops being true, the fix is a shared store such
as Redis.
"""
import math
import os
import threading
import time
from collections import deque
from collections.abc import Callable

from fastapi import HTTPException, status

DEFAULT_LIMIT_PER_HOUR = 20
WINDOW_SECONDS = 3600.0


def get_rate_limit_per_hour() -> int:
    raw = os.environ.get("RATE_LIMIT_PER_HOUR", "").strip()
    if not raw:
        return DEFAULT_LIMIT_PER_HOUR
    if not raw.isdigit() or int(raw) == 0:
        raise RuntimeError(f"RATE_LIMIT_PER_HOUR doit être un entier positif (reçu : {raw!r}).")
    return int(raw)


class RateLimit:
    """Sliding-window limiter usable directly as a FastAPI dependency.

    `limit=None` reads `RATE_LIMIT_PER_HOUR` on each call, so the env var is
    the single source of truth; tests pass an explicit limit and clock.
    """

    def __init__(
        self,
        scope: str,
        limit: int | None = None,
        window_seconds: float = WINDOW_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.scope = scope
        self._limit = limit
        self._window = window_seconds
        self._clock = clock
        self._hits: deque[float] = deque()
        # Sync dependencies run in FastAPI's threadpool, so concurrent
        # requests can reach this at the same time.
        self._lock = threading.Lock()

    def __call__(self) -> None:
        limit = self._limit if self._limit is not None else get_rate_limit_per_hour()
        with self._lock:
            now = self._clock()
            while self._hits and self._hits[0] <= now - self._window:
                self._hits.popleft()
            if len(self._hits) >= limit:
                retry_after = max(1, math.ceil(self._hits[0] + self._window - now))
                requests = "requête" if limit == 1 else "requêtes"
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Limite atteinte ({limit} {requests} par heure). "
                        f"Réessayez dans {math.ceil(retry_after / 60)} min."
                    ),
                    headers={"Retry-After": str(retry_after)},
                )
            self._hits.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


upload_rate_limit = RateLimit("upload")
chat_rate_limit = RateLimit("chat")
