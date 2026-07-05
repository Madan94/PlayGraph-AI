from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.v1.memory import _run_ingest
from backend.app.core.access import assert_athlete_access
from backend.app.core.security import CurrentUser, get_current_user
from backend.app.infrastructure.database import get_db
from backend.app.infrastructure.minio_client import upload_file
from memory.schemas import MemoryContent, MemoryPayload, MemoryType

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

FILE_ASSET_TYPES = frozenset({"video", "image", "audio", "json"})


class CreateSessionRequest(BaseModel):
    athlete_id: str
    title: str
    type: str = "training"
    sport: str = "unknown"
    description: str | None = None


class SubmitNoteRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


async def _get_session_context(db: AsyncSession, session_id: str):
    row = await db.execute(
        text("""
            SELECT s.athlete_id, s.sport, s.title, s.description, a.name AS athlete_name
            FROM sessions s
            JOIN athletes a ON a.id = s.athlete_id
            WHERE s.id = CAST(:id AS uuid)
        """),
        {"id": session_id},
    )
    session = row.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("")
async def create_session(
    body: CreateSessionRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await assert_athlete_access(db, user, body.athlete_id)
    session_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO sessions (id, athlete_id, type, sport, title, description, status)
            VALUES (
                CAST(:id AS uuid), CAST(:athlete_id AS uuid), :type, :sport, :title,
                :description, 'pending'
            )
        """),
        {
            "id": session_id,
            "athlete_id": body.athlete_id,
            "type": body.type,
            "sport": body.sport,
            "title": body.title,
            "description": body.description,
        },
    )
    await db.commit()
    return {"id": session_id, "status": "pending", "athlete_id": body.athlete_id}


async def _get_session_athlete_id(db: AsyncSession, session_id: str) -> str:
    session_row = await db.execute(
        text("SELECT athlete_id FROM sessions WHERE id = CAST(:id AS uuid)"),
        {"id": session_id},
    )
    session = session_row.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return str(session.athlete_id)


async def _publish_kafka(topic: str, payload: dict) -> None:
    try:
        from backend.app.infrastructure.kafka import publish_event

        await publish_event(topic, payload)
    except Exception:
        logger.exception("Kafka publish failed for topic=%s", topic)


@router.post("/{session_id}/assets")
async def upload_asset(
    session_id: str,
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if asset_type not in FILE_ASSET_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"asset_type must be one of: {', '.join(sorted(FILE_ASSET_TYPES))}",
        )

    athlete_id = await _get_session_athlete_id(db, session_id)
    await assert_athlete_access(db, user, athlete_id)
    session = await _get_session_context(db, session_id)

    content = await file.read()
    original_filename = file.filename or "upload"
    key = f"sessions/{session_id}/{uuid.uuid4()}_{original_filename}"
    mime = file.content_type or "application/octet-stream"
    upload_file(key, content, mime)

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
            "mime": mime,
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

    kafka_payload = {
        "session_id": session_id,
        "asset_id": asset_id,
        "minio_key": key,
        "asset_type": asset_type,
        "mime_type": mime,
        "athlete_id": athlete_id,
        "sport": session.sport,
        "session_title": session.title,
        "athlete_name": session.athlete_name,
        "description": session.description,
        "original_filename": original_filename,
    }

    await _publish_kafka(topic, kafka_payload)

    return {"asset_id": asset_id, "job_id": job_id, "status": "queued", "topic": topic}


@router.post("/{session_id}/notes")
async def submit_note(
    session_id: str,
    body: SubmitNoteRequest,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    athlete_id = await _get_session_athlete_id(db, session_id)
    await assert_athlete_access(db, user, athlete_id)
    session = await _get_session_context(db, session_id)

    note_text = body.content.strip()
    asset_id = str(uuid.uuid4())
    key = f"sessions/{session_id}/notes/{asset_id}.txt"
    upload_file(key, note_text.encode("utf-8"), "text/plain")

    await db.execute(
        text("""
            INSERT INTO session_assets (id, session_id, asset_type, minio_key, mime_type, size_bytes)
            VALUES (CAST(:id AS uuid), CAST(:session_id AS uuid), 'note', :key, 'text/plain', :size)
        """),
        {
            "id": asset_id,
            "session_id": session_id,
            "key": key,
            "size": len(note_text.encode("utf-8")),
        },
    )
    await db.execute(
        text("UPDATE sessions SET status = 'processing' WHERE id = CAST(:id AS uuid)"),
        {"id": session_id},
    )
    await db.commit()

    payload = MemoryPayload(
        athlete_id=athlete_id,
        session_id=session_id,
        sport=session.sport,
        athlete_name=session.athlete_name,
        session_title=session.title,
        description=session.description,
        asset_filename=f"note_{asset_id}.txt",
        memory_type=MemoryType.COACH_NOTE,
        source_worker="note_api",
        content=MemoryContent(
            summary=note_text,
            metrics={},
            entities=[f"sport:{session.sport}", f"athlete:{athlete_id}", f"session:{session_id}"],
        ),
    )
    background_tasks.add_task(_run_ingest, payload)

    return {
        "asset_id": asset_id,
        "status": "queued",
        "topic": None,
        "message": "Note saved to athlete memory",
    }


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    athlete_id = await _get_session_athlete_id(db, session_id)
    await assert_athlete_access(db, user, athlete_id)

    result = await db.execute(
        text("""
            SELECT id, athlete_id, title, type, sport, description, status, started_at
            FROM sessions WHERE id = CAST(:id AS uuid)
        """),
        {"id": session_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return dict(row._mapping)
