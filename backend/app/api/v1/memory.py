from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.deps import get_lifecycle_service, get_memory_client
from backend.app.core.access import assert_athlete_access
from backend.app.core.security import CurrentUser, get_current_user
from backend.app.infrastructure.database import async_session, get_db
from memory.lifecycle import MemoryLifecycleService
from memory.schemas import MemoryContent, MemoryPayload, MemoryType, RecallQuery

router = APIRouter(prefix="/memory", tags=["memory"])
logger = logging.getLogger(__name__)


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


async def _log_ingest(body: MemoryPayload, ref) -> None:
    async with async_session() as db:
        await db.execute(
            text("""
                INSERT INTO memory_operations_log (session_id, athlete_id, operation, cognee_ref, metadata)
                VALUES (CAST(:session_id AS uuid), CAST(:athlete_id AS uuid), 'remember', :ref, CAST(:meta AS jsonb))
            """),
            {
                "session_id": body.session_id,
                "athlete_id": body.athlete_id,
                "ref": ref.cognee_dataset,
                "meta": json.dumps({
                    "summary": body.content.summary[:500],
                    "source_worker": body.source_worker,
                    "sport": body.sport,
                }),
            },
        )
        await db.commit()


async def _run_ingest(body: MemoryPayload) -> None:
    logger.info(
        "Background ingest started for athlete=%s session=%s (%s)",
        body.athlete_id,
        body.session_id,
        body.source_worker,
    )
    lifecycle = MemoryLifecycleService(get_memory_client())
    try:
        ref = await lifecycle.ingest_worker_output(body)
        await _log_ingest(body, ref)
        logger.info(
            "Background ingest completed for athlete=%s session=%s dataset=%s",
            body.athlete_id,
            body.session_id,
            ref.cognee_dataset,
        )
    except Exception:
        logger.exception(
            "Background ingest failed for athlete=%s session=%s",
            body.athlete_id,
            body.session_id,
        )


@router.post("/ingest", status_code=202)
async def ingest_worker_memory(
    body: MemoryPayload,
    background_tasks: BackgroundTasks,
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
):
    """Worker ingest — internal key required; returns immediately."""
    if not settings.auth_internal_service_key or x_internal_key != settings.auth_internal_service_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    background_tasks.add_task(_run_ingest, body)
    return {
        "status": "accepted",
        "session_id": body.session_id,
        "athlete_id": body.athlete_id,
    }


@router.post("/remember")
async def remember_memory(
    body: RememberRequest,
    user: CurrentUser = Depends(get_current_user),
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    await assert_athlete_access(db, user, body.athlete_id)
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
    user: CurrentUser = Depends(get_current_user),
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    await assert_athlete_access(db, user, body.athlete_id)
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
    user: CurrentUser = Depends(get_current_user),
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    await assert_athlete_access(db, user, athlete_id)
    await lifecycle.run_evolution_cycle(athlete_id)
    return {"status": "ok", "operation": "improve+forget"}


@router.get("/stats")
async def memory_stats(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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

