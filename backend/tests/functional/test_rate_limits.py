"""
Functional tests of `GET /api/rate-limits`, through the real `require_auth`
and `RateLimit` dependencies (`auth_client` fixture — see test_auth.py for
why `client` isn't used here: it bypasses both).

Partial consumption is simulated by calling `upload_rate_limit`/
`chat_rate_limit` directly rather than through `/api/upload`/`/api/chat`:
this endpoint's own job is only to report those singletons' already-in-memory
state, not to re-verify that uploading or chatting consumes it (already
covered in test_auth.py's rate-limiting tests).
"""
from __future__ import annotations

from datetime import datetime

from app.rate_limit import chat_rate_limit, upload_rate_limit


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_rate_limits_requires_authentication(auth_client):
    response = auth_client.get("/api/rate-limits")

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_rate_limits_reports_full_quota_when_nothing_consumed(auth_client, token):
    response = auth_client.get("/api/rate-limits", headers=_bearer(token))

    assert response.status_code == 200
    body = response.json()
    assert body["upload"]["remaining"] == body["upload"]["limit"]
    assert body["chat"]["remaining"] == body["chat"]["limit"]
    # Both `reset_at` values must be real, parseable instants.
    datetime.fromisoformat(body["upload"]["reset_at"])
    datetime.fromisoformat(body["chat"]["reset_at"])


def test_rate_limits_reflects_partial_consumption_per_scope(auth_client, token):
    for _ in range(3):
        upload_rate_limit()
    chat_rate_limit()

    response = auth_client.get("/api/rate-limits", headers=_bearer(token))

    assert response.status_code == 200
    body = response.json()
    assert body["upload"]["remaining"] == body["upload"]["limit"] - 3
    assert body["chat"]["remaining"] == body["chat"]["limit"] - 1
