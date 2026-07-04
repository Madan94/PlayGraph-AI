from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.application.chat_service import ChatRequest, ChatResponse, ChatService
from backend.app.core.deps import get_lifecycle_service
from backend.app.infrastructure.database import get_db
from memory.lifecycle import MemoryLifecycleService

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service(
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
) -> ChatService:
    return ChatService(lifecycle)


@router.post("", response_model=ChatResponse)
async def coach_chat(
    body: ChatRequest,
    chat: ChatService = Depends(get_chat_service),
    db: AsyncSession = Depends(get_db),
):
    """Coach Q&A: recall() → Qwen LLM → grounded answer with sources."""
    result = await chat.coach_chat(body.athlete_id, body.message)

    await db.execute(
        text("""
            INSERT INTO memory_operations_log (athlete_id, operation, metadata)
            VALUES (CAST(:athlete_id AS uuid), 'recall', CAST(:meta AS jsonb))
        """),
        {
            "athlete_id": body.athlete_id,
            "meta": json.dumps({
                "query": body.message,
                "count": result.recall.get("memories_used", 0),
                "via": "coach_chat",
            }),
        },
    )
    await db.commit()
    return result


class TimelineEntry(BaseModel):
    summary: str
    memory_id: str | None = None


@router.get("/timeline/{athlete_id}")
async def athlete_timeline(
    athlete_id: str,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
):
    """Performance timeline powered entirely by recall()."""
    result = await lifecycle.recall_timeline(athlete_id)
    return {
        "athlete_id": athlete_id,
        "entries": [
            TimelineEntry(summary=s.summary, memory_id=s.memory_id).model_dump()
            for s in result.sources
        ],
        "memories_used": result.memories_used,
    }
