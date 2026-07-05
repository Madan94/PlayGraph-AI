from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from memory.env_loader import load_project_env

load_project_env()

from backend.app.api.v1 import athletes, auth, chat, health, memory, reports, sessions, stream
from backend.app.core.config import settings
from backend.app.infrastructure.kafka import close_producer


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_producer()


app = FastAPI(
    title="NextPlayAI API",
    description="Memory-first athlete intelligence platform — Cognee is the brain",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(athletes.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(memory.router, prefix="/api/v1")
app.include_router(stream.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
