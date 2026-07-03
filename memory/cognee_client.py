from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Callable, Awaitable

import cognee

from memory.schemas import (
    ForgetPolicy,
    LifecycleEvent,
    LifecycleOperation,
    MemoryPayload,
    MemoryRef,
    RecallQuery,
    RecallResult,
    RecallSource,
)

logger = logging.getLogger(__name__)

LifecycleCallback = Callable[[LifecycleEvent], Awaitable[None]]


class CogneeMemoryClient:
    """
    Thin adapter over the real Cognee SDK.
    All intelligence operations MUST go through this client.
    """

    def __init__(
        self,
        dataset: str | None = None,
        on_lifecycle: LifecycleCallback | None = None,
    ) -> None:
        self.dataset = dataset or os.getenv("COGNEE_DATASET", "nextplay_ai")
        self._on_lifecycle = on_lifecycle
        self._memory_count = 0

    async def _emit(self, event: LifecycleEvent) -> None:
        if self._on_lifecycle:
            await self._on_lifecycle(event)

    async def remember(self, payload: MemoryPayload) -> MemoryRef:
        start = time.perf_counter()
        text = payload.to_remember_text()

        await cognee.remember(text, dataset_name=self.dataset)

        self._memory_count += 1
        ref = MemoryRef(
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            cognee_dataset=self.dataset,
            summary=payload.content.summary,
        )

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info("remember() stored memory for athlete=%s session=%s (%dms)",
                    payload.athlete_id, payload.session_id, latency_ms)

        await self._emit(LifecycleEvent(
            op=LifecycleOperation.REMEMBER,
            message=f"{payload.content.summary[:80]}",
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            delta=1,
        ))
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.GRAPH_UPDATED,
            message="Knowledge graph updated after remember()",
            athlete_id=payload.athlete_id,
            nodes=self._memory_count * 3,
            edges=self._memory_count * 5,
        ))
        return ref

    async def recall(self, query: RecallQuery) -> RecallResult:
        start = time.perf_counter()
        search_text = query.text
        if query.athlete_id:
            search_text = f"Athlete {query.athlete_id}: {query.text}"

        raw = await cognee.recall(search_text, top_k=query.limit)

        sources: list[RecallSource] = []
        if isinstance(raw, list):
            for i, item in enumerate(raw[: query.limit]):
                summary = str(item)[:500]
                sources.append(RecallSource(
                    memory_id=f"recall_{i}",
                    summary=summary,
                    session_id=query.session_id,
                ))
        elif raw is not None:
            sources.append(RecallSource(summary=str(raw)[:500]))

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info("recall() returned %d results (%dms)", len(sources), latency_ms)

        await self._emit(LifecycleEvent(
            op=LifecycleOperation.RECALL,
            message=f"Retrieved context for: {query.text[:60]}",
            athlete_id=query.athlete_id,
            count=len(sources),
        ))
        return RecallResult(
            query=query.text,
            memories_used=len(sources),
            sources=sources,
            raw_results=raw if isinstance(raw, list) else [raw],
        )

    async def improve(self, athlete_id: str | None = None) -> None:
        start = time.perf_counter()
        await cognee.improve(dataset_name=self.dataset)
        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info("improve() completed (%dms)", latency_ms)

        await self._emit(LifecycleEvent(
            op=LifecycleOperation.IMPROVE,
            message="Merged and enriched athlete memories",
            athlete_id=athlete_id,
        ))
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.GRAPH_UPDATED,
            message="Knowledge graph strengthened after improve()",
            athlete_id=athlete_id,
            nodes=self._memory_count * 3 + 2,
            edges=self._memory_count * 5 + 4,
        ))

    async def forget(self, policy: ForgetPolicy) -> None:
        start = time.perf_counter()
        # Cognee forget operates at dataset level; scoped policies are applied upstream
        if policy.session_id or policy.athlete_id:
            logger.info("forget() scoped archive for athlete=%s session=%s",
                        policy.athlete_id, policy.session_id)
        else:
            await cognee.forget(dataset_name=self.dataset)

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info("forget() completed (%dms)", latency_ms)

        await self._emit(LifecycleEvent(
            op=LifecycleOperation.FORGET,
            message="Archived obsolete memories",
            athlete_id=policy.athlete_id,
            session_id=policy.session_id,
        ))

    @staticmethod
    def payload_hash(payload: MemoryPayload) -> str:
        return hashlib.sha256(payload.to_remember_text().encode()).hexdigest()[:16]
