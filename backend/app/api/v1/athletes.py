from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.access import assert_athlete_access, list_accessible_athlete_ids
from backend.app.core.security import CurrentUser, get_current_user, require_role
from backend.app.infrastructure.database import get_db

router = APIRouter(prefix="/athletes", tags=["athletes"])

CoachUser = Depends(require_role("coach"))


class CreateAthleteRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sport: str = Field(default="athletics", max_length=64)
    metadata: dict = Field(default_factory=dict)


@router.post("", status_code=201)
async def create_athlete(
    body: CreateAthleteRequest,
    user: CurrentUser = CoachUser,
    db: AsyncSession = Depends(get_db),
):
    athlete_id = str(uuid.uuid4())
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
        {
            "id": athlete_id,
            "name": body.name.strip(),
            "sport": body.sport.strip(),
            "metadata": json.dumps(body.metadata),
        },
    )
    await db.execute(
        text("""
            INSERT INTO coach_athlete (coach_id, athlete_id)
            VALUES (CAST(:coach_id AS uuid), CAST(:athlete_id AS uuid))
        """),
        {"coach_id": user.id, "athlete_id": athlete_id},
    )
    await db.commit()
    return {
        "id": athlete_id,
        "name": body.name.strip(),
        "sport": body.sport.strip(),
        "metadata": body.metadata,
    }


@router.get("")
async def list_athletes(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed = await list_accessible_athlete_ids(db, user)
    if allowed is None:
        query = text("""
            SELECT id, name, sport, metadata
            FROM athletes
            ORDER BY name
        """)
        result = await db.execute(query)
    elif not allowed:
        return {"athletes": []}
    else:
        placeholders = ", ".join(f":id{i}" for i in range(len(allowed)))
        params = {f"id{i}": aid for i, aid in enumerate(allowed)}
        result = await db.execute(
            text(f"""
                SELECT id, name, sport, metadata
                FROM athletes
                WHERE id::text IN ({placeholders})
                ORDER BY name
            """),
            params,
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
async def get_athlete(
    athlete_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await assert_athlete_access(db, user, athlete_id)
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
