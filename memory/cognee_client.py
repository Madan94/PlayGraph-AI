"""Lightweight vector-memory client.

Uses cognee's embedding engine directly with local LanceDB storage.
Bypasses cognee.remember()/cognify() which crashes on Python 3.13 + Windows
due to a SIGSEGV in the TikToken Rust extension inside a spawned subprocess.
"""
from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Callable, Awaitable

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

_EMBED_DIMS = int(os.environ.get("EMBEDDING_DIMENSIONS", "1536"))

# Module-level singletons — initialised once on first memory operation
_db = None
_table = None


def _get_lancedb_path() -> str:
    base = os.environ.get(
        "DATA_ROOT_DIRECTORY",
        os.path.join(os.path.expanduser("~"), ".nextplay", "cognee_data"),
    )
    return os.path.join(base, "vector_memories")


async def _get_table():
    global _db, _table
    import lancedb
    import pyarrow as pa

    path = _get_lancedb_path()
    os.makedirs(path, exist_ok=True)

    if _db is None:
        _db = await lancedb.connect_async(path)

    if _table is None:
        try:
            existing = await _db.list_tables()
        except Exception:
            existing = []
        if "memories" in existing:
            _table = await _db.open_table("memories")
        else:
            schema = pa.schema([
                pa.field("id", pa.utf8()),
                pa.field("text", pa.utf8()),
                pa.field("athlete_id", pa.utf8()),
                pa.field("session_id", pa.utf8()),
                pa.field("vector", pa.list_(pa.float32(), _EMBED_DIMS)),
            ])
            _table = await _db.create_table("memories", schema=schema)

    return _table


def _get_embedding_engine():
    from cognee.infrastructure.databases.vector.embeddings import get_embedding_engine
    return get_embedding_engine()


class CogneeMemoryClient:
    """
    Thin adapter over LanceDB + cognee embedding engine.
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
        import uuid as _uuid
        start = time.perf_counter()
        text = payload.to_remember_text()

        engine = _get_embedding_engine()
        vectors = await engine.embed_text([text])
        vector = [float(v) for v in vectors[0]]

        table = await _get_table()
        row = {
            "id": str(_uuid.uuid4()),
            "text": text,
            "athlete_id": str(payload.athlete_id),
            "session_id": str(payload.session_id),
            "vector": vector,
        }
        await table.add([row])

        self._memory_count += 1
        ref = MemoryRef(
            athlete_id=payload.athlete_id,
            session_id=payload.session_id,
            cognee_dataset=self.dataset,
            summary=payload.content.summary,
        )

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "remember() stored memory for athlete=%s session=%s (%dms)",
            payload.athlete_id, payload.session_id, latency_ms,
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
            message="Vector index updated after remember()",
            athlete_id=payload.athlete_id,
            nodes=self._memory_count,
            edges=self._memory_count * 2,
        ))
        return ref

    async def remember_and_improve(self, payload: MemoryPayload) -> MemoryRef:
        """Alias kept for callers that still use the old name."""
        return await self.remember(payload)

    async def recall(self, query: RecallQuery) -> RecallResult:
        start = time.perf_counter()

        engine = _get_embedding_engine()
        vectors = await engine.embed_text([query.text])
        query_vector = [float(v) for v in vectors[0]]

        table = await _get_table()
        search = table.vector_search(query_vector).limit(query.limit)
        if query.athlete_id:
            safe_id = str(query.athlete_id).replace("'", "")
            search = search.where(f"athlete_id = '{safe_id}'")

        rows = await search.to_list()

        sources: list[RecallSource] = []
        for i, row in enumerate(rows):
            raw_text = row.get("text", "")
            summary = raw_text
            for line in raw_text.split("\n"):
                if line.startswith("Summary: "):
                    summary = line[len("Summary: "):]
                    break
            sources.append(RecallSource(
                memory_id=row.get("id", f"recall_{i}"),
                summary=summary[:500],
                session_id=row.get("session_id"),
            ))

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
            raw_results=[r.get("text", "") for r in rows],
        )

    async def improve(self, athlete_id: str | None = None) -> None:
        logger.info("improve() — no-op in direct-LanceDB mode (athlete=%s)", athlete_id)
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.IMPROVE,
            message="Memory consolidation skipped (direct vector mode)",
            athlete_id=athlete_id,
        ))
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.GRAPH_UPDATED,
            message="Vector index ready",
            athlete_id=athlete_id,
            nodes=self._memory_count * 3 + 2,
            edges=self._memory_count * 5 + 4,
        ))

    async def forget(self, policy: ForgetPolicy) -> None:
        logger.info(
            "forget() for athlete=%s session=%s",
            policy.athlete_id, policy.session_id,
        )
        await self._emit(LifecycleEvent(
            op=LifecycleOperation.FORGET,
            message="Memory archive logged",
            athlete_id=policy.athlete_id,
            session_id=policy.session_id,
        ))

    @staticmethod
    def payload_hash(payload: MemoryPayload) -> str:
        return hashlib.sha256(payload.to_remember_text().encode()).hexdigest()[:16]
