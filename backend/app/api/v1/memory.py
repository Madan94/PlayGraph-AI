from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import get_lifecycle_service, get_memory_client
from backend.app.infrastructure.database import get_db
from memory.lifecycle import MemoryLifecycleService
from memory.schemas import MemoryContent, MemoryPayload, MemoryType, RecallQuery

router = APIRouter(prefix="/memory", tags=["memory"])


class RememberRequest(BaseModel):
    athlete_id: str
    session_id: str
    summary: str
    metrics: dict = {}
    memory_type: MemoryType = MemoryType.PERFORMANCE_METRIC
    source_worker: str = "api"


class RecallRequest(BaseModel):
    athlete_id: str
    query: str
    limit: int = 10


@router.post("/remember")
async def remember_memory(
    body: RememberRequest,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    payload = MemoryPayload(
        athlete_id=body.athlete_id,
        session_id=body.session_id,
        memory_type=body.memory_type,
        source_worker=body.source_worker,
        content=MemoryContent(summary=body.summary, metrics=body.metrics),
    )
    client = get_memory_client()
    ref = await lifecycle.ingest_worker_output(payload)

    await db.execute(
        text("""
            INSERT INTO memory_operations_log (session_id, athlete_id, operation, cognee_ref, metadata)
            VALUES (CAST(:session_id AS uuid), CAST(:athlete_id AS uuid), 'remember', :ref, CAST(:meta AS jsonb))
        """),
        {
            "session_id": body.session_id,
            "athlete_id": body.athlete_id,
            "ref": ref.memory_id,
            "meta": json.dumps({"summary": body.summary}),
        },
    )
    await db.commit()
    return {"status": "ok", "memory": ref.model_dump()}


@router.post("/recall")
async def recall_memory(
    body: RecallRequest,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    result = await lifecycle.recall_for_coach(body.athlete_id, body.query)

    await db.execute(
        text("""
            INSERT INTO memory_operations_log (athlete_id, operation, metadata)
            VALUES (CAST(:athlete_id AS uuid), 'recall', CAST(:meta AS jsonb))
        """),
        {
            "athlete_id": body.athlete_id,
            "meta": json.dumps({"query": body.query, "count": result.memories_used}),
        },
    )
    await db.commit()
    return result.model_dump()


@router.post("/improve/{athlete_id}")
async def improve_memories(
    athlete_id: str,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
):
    await lifecycle.run_evolution_cycle(athlete_id)
    return {"status": "ok", "operation": "improve+forget"}


@router.get("/stats")
async def memory_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT operation, COUNT(*) as count
        FROM memory_operations_log
        GROUP BY operation
    """))
    ops = {row.operation: row.count for row in result}
    return {
        "operations": ops,
        "cognee_dataset": get_memory_client().dataset,
    }

