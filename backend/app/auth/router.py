from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.security import (
    AuthSettings,
    create_access_token,
    get_auth_settings,
    verify_credentials,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    """Token lifetime in seconds."""


# A plain `def`, not `async def`: bcrypt is deliberately slow (~0.25 s), and a
# sync route runs in FastAPI's threadpool instead of blocking the event loop.
@router.post("/login")
def login(
    body: LoginRequest,
    settings: Annotated[AuthSettings, Depends(get_auth_settings)],
) -> TokenResponse:
    if not verify_credentials(body.username, body.password, settings):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect.",
        )
    return TokenResponse(
        access_token=create_access_token(body.username, settings),
        expires_in=int(settings.token_ttl.total_seconds()),
    )
