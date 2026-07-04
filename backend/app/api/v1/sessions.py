from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.infrastructure.database import get_db
from backend.app.infrastructure.minio_client import upload_file

router = APIRouter(prefix="/sessions", tags=["sessions"])

DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


class CreateSessionRequest(BaseModel):
    athlete_id: str = DEMO_ATHLETE_ID
    title: str
    type: str = "training"
    sport: str = "cricket"


@router.post("")
async def create_session(body: CreateSessionRequest, db: AsyncSession = Depends(get_db)):
    session_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO sessions (id, athlete_id, type, sport, title, status)
            VALUES (CAST(:id AS uuid), CAST(:athlete_id AS uuid), :type, :sport, :title, 'pending')
        """),
        {
            "id": session_id,
            "athlete_id": body.athlete_id,
            "type": body.type,
            "sport": body.sport,
            "title": body.title,
        },
    )
    await db.commit()
    return {"id": session_id, "status": "pending"}


@router.post("/{session_id}/assets")
async def upload_asset(
    session_id: str,
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    key = f"sessions/{session_id}/{uuid.uuid4()}_{file.filename}"
    upload_file(key, content, file.content_type or "application/octet-stream")

    asset_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO session_assets (id, session_id, asset_type, minio_key, mime_type, size_bytes)
            VALUES (CAST(:id AS uuid), CAST(:session_id AS uuid), CAST(:asset_type AS asset_type), :key, :mime, :size)
        """),
        {
            "id": asset_id,
            "session_id": session_id,
            "asset_type": asset_type,
            "key": key,
            "mime": file.content_type,
            "size": len(content),
        },
    )
    job_id = str(uuid.uuid4())
    topic = f"{asset_type}.process.requested"
    await db.execute(
        text("""
            INSERT INTO ingestion_jobs (id, session_id, asset_id, status, kafka_topic)
            VALUES (CAST(:id AS uuid), CAST(:session_id AS uuid), CAST(:asset_id AS uuid), 'queued', :topic)
        """),
        {"id": job_id, "session_id": session_id, "asset_id": asset_id, "topic": topic},
    )
    await db.execute(
        text("UPDATE sessions SET status = 'processing' WHERE id = CAST(:id AS uuid)"),
        {"id": session_id},
    )
    await db.commit()

    # Publish to Kafka (best-effort)
    try:
        from backend.app.infrastructure.kafka import publish_event
        await publish_event(topic, {
            "session_id": session_id,
            "asset_id": asset_id,
            "minio_key": key,
            "asset_type": asset_type,
            "athlete_id": DEMO_ATHLETE_ID,
        })
    except Exception:
        pass  # Worker can poll ingestion_jobs as fallback

    return {"asset_id": asset_id, "job_id": job_id, "status": "queued", "topic": topic}


@router.get("/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, athlete_id, title, type, sport, status, started_at FROM sessions WHERE id = CAST(:id AS uuid)"),
        {"id": session_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return dict(row._mapping)
