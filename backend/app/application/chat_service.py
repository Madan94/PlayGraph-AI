from __future__ import annotations

from pydantic import BaseModel

from backend.app.infrastructure.llm import generate_coach_answer
from memory.lifecycle import MemoryLifecycleService


class ChatRequest(BaseModel):
    athlete_id: str
    message: str


class ChatSource(BaseModel):
    memory_id: str | None = None
    summary: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    recall: dict


class ChatService:
    def __init__(self, lifecycle: MemoryLifecycleService) -> None:
        self.lifecycle = lifecycle

    async def coach_chat(
        self,
        athlete_id: str,
        message: str,
        *,
        athlete_name: str = "the athlete",
        sport: str = "athletics",
    ) -> ChatResponse:
        recall_result = await self.lifecycle.recall_for_coach(athlete_id, message)

        context_parts = [
            f"- {src.summary}" for src in recall_result.sources[:12]
        ]
        memory_context = "\n".join(context_parts) if context_parts else "No memories found."

        answer = await generate_coach_answer(
            message,
            memory_context,
            sport=sport,
            athlete_name=athlete_name,
        )

        sources = [
            ChatSource(
                memory_id=src.memory_id,
                summary=src.summary,
                session_id=src.session_id,
            ).model_dump()
            for src in recall_result.sources
        ]

        return ChatResponse(
            answer=answer,
            recall={
                "query": message,
                "memories_used": recall_result.memories_used,
                "sources": sources,
            },
        )
