from fastapi import APIRouter
from pydantic import BaseModel

from app.agent.graph import run_chat

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    reply = run_chat(request.message)
    return ChatResponse(reply=reply)
