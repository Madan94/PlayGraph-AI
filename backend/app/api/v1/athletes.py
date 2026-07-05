from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.infrastructure.database import get_db

router = APIRouter(prefix="/athletes", tags=["athletes"])


class CreateAthleteRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sport: str = Field(default="athletics", max_length=64)
    metadata: dict = Field(default_factory=dict)
    user_id: str | None = None


@router.post("", status_code=201)
async def create_athlete(body: CreateAthleteRequest, db: AsyncSession = Depends(get_db)):
    athlete_id = str(uuid.uuid4())
    if body.user_id:
        user_row = await db.execute(
            text("SELECT id FROM users WHERE id = CAST(:user_id AS uuid)"),
            {"user_id": body.user_id},
        )
        if not user_row.first():
            raise HTTPException(status_code=404, detail="Linked user not found")

    params = {
        "id": athlete_id,
        "name": body.name.strip(),
        "sport": body.sport.strip(),
        "metadata": json.dumps(body.metadata),
    }

    if body.user_id:
        await db.execute(
            text("""
                INSERT INTO athletes (id, user_id, name, sport, metadata)
                VALUES (
                    CAST(:id AS uuid),
                    CAST(:user_id AS uuid),
                    :name,
                    :sport,
                    CAST(:metadata AS jsonb)
                )
            """),
            {**params, "user_id": body.user_id},
        )
    else:
        await db.execute(
            text("""
                INSERT INTO athletes (id, name, sport, metadata)
                VALUES (
                    CAST(:id AS uuid),
                    :name,
                    :sport,
                    CAST(:metadata AS jsonb)
                )
            """),
            params,
        )
    await db.commit()
    return {
        "id": athlete_id,
        "name": body.name.strip(),
        "sport": body.sport.strip(),
        "metadata": body.metadata,
    }


@router.get("")
async def list_athletes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT id, name, sport, metadata
            FROM athletes
            ORDER BY name
        """)
    )
    return {
        "athletes": [
            {
                "id": str(row.id),
                "name": row.name,
                "sport": row.sport,
                "metadata": row.metadata or {},
            }
            for row in result
        ]
    }


@router.get("/{athlete_id}")
async def get_athlete(athlete_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT id, name, sport, metadata
            FROM athletes
            WHERE id = CAST(:athlete_id AS uuid)
        """),
        {"athlete_id": athlete_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return {
        "id": str(row.id),
        "name": row.name,
        "sport": row.sport,
        "metadata": row.metadata or {},
    }
