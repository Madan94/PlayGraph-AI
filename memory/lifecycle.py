from __future__ import annotations

import logging

from memory.cognee_client import CogneeMemoryClient
from memory.schemas import ForgetPolicy, MemoryPayload, MemoryRef, RecallQuery, RecallResult

logger = logging.getLogger(__name__)


class MemoryLifecycleService:
    """
    Orchestrates the full Cognee memory lifecycle:
    remember → improve → forget
    """

    def __init__(self, client: CogneeMemoryClient) -> None:
        self.client = client

    async def ingest_worker_output(self, payload: MemoryPayload) -> MemoryRef:
        """Called by workers after extracting structured data."""
        return await self.client.remember_and_improve(payload)

    async def recall_for_coach(self, athlete_id: str, question: str) -> RecallResult:
        return await self.client.recall(RecallQuery(
            text=question,
            athlete_id=athlete_id,
            limit=12,
        ))

    async def recall_timeline(self, athlete_id: str) -> RecallResult:
        return await self.client.recall(RecallQuery(
            text="performance timeline training sessions matches injuries progress",
            athlete_id=athlete_id,
            limit=20,
        ))

    async def run_evolution_cycle(self, athlete_id: str) -> None:
        """Periodic memory evolution: improve then forget stale data."""
        await self.client.improve(athlete_id=athlete_id)
        await self.client.forget(ForgetPolicy(
            athlete_id=athlete_id,
            older_than_days=365,
        ))

    async def remember_session_summary(
        self,
        athlete_id: str,
        session_id: str,
        summary: str,
        metrics: dict,
    ) -> None:
        from memory.schemas import MemoryContent, MemoryType

        payload = MemoryPayload(
            athlete_id=athlete_id,
            session_id=session_id,
            memory_type=MemoryType.SESSION_SUMMARY,
            source_worker="ingestion_service",
            content=MemoryContent(summary=summary, metrics=metrics),
        )
        await self.ingest_worker_output(payload)
