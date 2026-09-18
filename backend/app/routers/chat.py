from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.agent.graph import run_chat
from app.rate_limit import chat_rate_limit

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(chat_rate_limit)])
def chat(request: ChatRequest) -> ChatResponse:
    reply = run_chat(request.message)
    return ChatResponse(reply=reply)
