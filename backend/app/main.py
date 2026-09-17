from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.db import init_db
from app.routers import chat, upload

app = FastAPI(title="InfoPay AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(upload.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
