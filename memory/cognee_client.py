from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Callable, Awaitable

from memory.env_loader import load_project_env

load_project_env(override=True)

import cognee

from memory.cognee_session import cognee_exclusive
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


def _recall_item_to_text(item: object) -> str:
    """Extract human-readable text from Cognee 1.x recall result items."""
    if item is None:
        return ""

    text = getattr(item, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    content = getattr(item, "content", None)
    if isinstance(content, str) and content.strip():
        return content.strip()

    question = getattr(item, "question", None)
    answer = getattr(item, "answer", None)
    if isinstance(question, str) and isinstance(answer, str):
        return f"Q: {question}\nA: {answer}".strip()

    if isinstance(item, dict):
        for key in ("text", "content", "answer", "summary"):
            val = item.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()

    if hasattr(item, "model_dump"):
        data = item.model_dump()
        for key in ("text", "content", "answer", "summary"):
            val = data.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()

    return str(item).strip()


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

    def athlete_dataset(self, athlete_id: str) -> str:
        return f"{self.dataset}_{athlete_id}"

    def _resolve_dataset(self, athlete_id: str | None) -> str:
        if athlete_id:
            return self.athlete_dataset(athlete_id)
        return self.dataset

    async def _emit(self, event: LifecycleEvent) -> None:
        if self._on_lifecycle:
            await self._on_lifecycle(event)

    async def remember(self, payload: MemoryPayload) -> MemoryRef:
        start = time.perf_counter()
        text = payload.to_remember_text()

        ds = self.athlete_dataset(payload.athlete_id)
        logger.info(
            "Cognee remember() starting for dataset=%s session=%s (graph+LLM phase, often 1-3 min)",
            ds,
            payload.session_id,
        )
        async with cognee_exclusive(write=True):
            await cognee.remember(text, dataset_name=ds, self_improvement=False)
        logger.info(
            "Cognee remember() finished for dataset=%s session=%s",
            ds,
            payload.session_id,
        )

        self._memory_count += 1
        ref = MemoryRef(
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            cognee_dataset=ds,
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
        ))
        return ref

    async def remember_and_improve(self, payload: MemoryPayload) -> MemoryRef:
        """Store worker memory under a single write lock (improve runs on demand later)."""
        start = time.perf_counter()
        text = payload.to_remember_text()
        ds = self.athlete_dataset(payload.athlete_id)
        logger.info(
            "Cognee remember() starting for dataset=%s session=%s (graph+LLM phase, often 1-3 min)",
            ds,
            payload.session_id,
        )

        async with cognee_exclusive(write=True):
            await cognee.remember(text, dataset_name=ds, self_improvement=False)
        logger.info(
            "Cognee remember() finished for dataset=%s session=%s",
            ds,
            payload.session_id,
        )

        self._memory_count += 1
        ref = MemoryRef(
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            cognee_dataset=ds,
            summary=payload.content.summary,
        )

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "remember_and_improve() for athlete=%s session=%s (%dms)",
            payload.athlete_id,
            payload.session_id,
            latency_ms,
        )

        await self._emit(LifecycleEvent(
            op=LifecycleOperation.REMEMBER,
            message=f"{payload.content.summary[:80]}",
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            delta=1,
        ))
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.GRAPH_UPDATED,
            message="Knowledge graph updated after worker remember()",
            athlete_id=payload.athlete_id,
        ))
        return ref

    async def recall(self, query: RecallQuery) -> RecallResult:
        start = time.perf_counter()
        search_text = query.text
        if query.athlete_id:
            search_text = f"Athlete {query.athlete_id}: {query.text}"

        if not query.athlete_id:
            logger.warning("recall() without athlete_id — using base dataset only")
        ds = self._resolve_dataset(query.athlete_id)
        async with cognee_exclusive(write=False):
            raw = await cognee.recall(search_text, top_k=query.limit, datasets=[ds])

        sources: list[RecallSource] = []
        if isinstance(raw, list):
            for i, item in enumerate(raw[: query.limit]):
                summary = _recall_item_to_text(item)
                if not summary:
                    continue
                sources.append(RecallSource(
                    memory_id=f"recall_{i}",
                    summary=summary[:2000],
                    session_id=query.session_id,
                ))
        elif raw is not None:
            summary = _recall_item_to_text(raw)
            if summary:
                sources.append(RecallSource(summary=summary[:2000]))

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
        ds = self._resolve_dataset(athlete_id)
        async with cognee_exclusive(write=True):
            await cognee.improve(dataset=ds)
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
        ))

    async def forget(self, policy: ForgetPolicy) -> None:
        start = time.perf_counter()
        # Cognee forget operates at dataset level; scoped policies are applied upstream
        async with cognee_exclusive(write=True):
            if policy.athlete_id:
                await cognee.forget(dataset=self.athlete_dataset(policy.athlete_id))
                logger.info("forget() cleared dataset for athlete=%s", policy.athlete_id)
            elif policy.session_id:
                logger.info("forget() session-scoped archive for session=%s", policy.session_id)
            else:
                await cognee.forget(dataset=self.dataset)

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
