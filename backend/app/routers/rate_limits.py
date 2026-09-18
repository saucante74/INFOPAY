from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from app.rate_limit import RateLimit, chat_rate_limit, upload_rate_limit

router = APIRouter(prefix="/api", tags=["rate-limits"])


class RateLimitStatus(BaseModel):
    remaining: int
    limit: int
    reset_at: datetime


class RateLimitsResponse(BaseModel):
    upload: RateLimitStatus
    chat: RateLimitStatus


def _status(limiter: RateLimit) -> RateLimitStatus:
    return RateLimitStatus(
        remaining=limiter.remaining(), limit=limiter.limit(), reset_at=limiter.reset_at()
    )


@router.get("/rate-limits", response_model=RateLimitsResponse)
def rate_limits() -> RateLimitsResponse:
    return RateLimitsResponse(upload=_status(upload_rate_limit), chat=_status(chat_rate_limit))
