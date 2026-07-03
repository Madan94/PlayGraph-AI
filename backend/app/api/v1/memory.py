from __future__ import annotations

import json
import uuid
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


class DemoSeedRequest(BaseModel):
    athlete_id: str = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


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
            VALUES (:session_id::uuid, :athlete_id::uuid, 'remember', :ref, :meta::jsonb)
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
            VALUES (:athlete_id::uuid, 'recall', :meta::jsonb)
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


@router.post("/seed-demo")
async def seed_demo_data(
    body: DemoSeedRequest,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
):
    """Seed cricket demo memories for hackathon judges."""
    athlete_id = body.athlete_id
    memories = [
        ("Rahul scored 78 off 52 balls with strike rate 150 in net session", {"runs": 78, "strike_rate": 150}),
        ("Cover drive technique improved — coach noted better head position", {"drill": "cover_drive", "rating": 8}),
        ("GPS data: 4.2km covered, peak HR 178 bpm during fielding drills", {"distance_km": 4.2, "peak_hr": 178}),
        ("Minor hamstring tightness reported post-session — monitoring recommended", {"injury": "hamstring", "severity": "minor"}),
        ("Sprint between wickets averaged 28.3 km/h — up 6% from last month", {"sprint_speed_kmh": 28.3, "improvement_pct": 6}),
    ]
    session_id = str(uuid.uuid4())
    for summary, metrics in memories:
        payload = MemoryPayload(
            athlete_id=athlete_id,
            session_id=session_id,
            memory_type=MemoryType.PERFORMANCE_METRIC,
            source_worker="demo_seed",
            content=MemoryContent(summary=summary, metrics=metrics, entities=[f"athlete:{athlete_id}"]),
        )
        await lifecycle.ingest_worker_output(payload)

    return {"status": "ok", "memories_seeded": len(memories), "session_id": session_id}
