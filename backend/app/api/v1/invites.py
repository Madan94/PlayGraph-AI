from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import CurrentUser, require_role
from backend.app.infrastructure.database import get_db

router = APIRouter(prefix="/invites", tags=["invites"])

CoachUser = Depends(require_role("coach"))
AthleteUser = Depends(require_role("athlete"))


def _generate_invite_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class CreateInviteResponse(BaseModel):
    code: str
    expires_at: datetime | None
    max_uses: int


class RedeemInviteBody(BaseModel):
    code: str = Field(min_length=4, max_length=16)


@router.post("", response_model=CreateInviteResponse)
async def create_invite(
    user: CurrentUser = CoachUser,
    db: AsyncSession = Depends(get_db),
):
    code = _generate_invite_code()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    await db.execute(
        text("""
            INSERT INTO coach_invites (coach_id, code, expires_at, max_uses)
            VALUES (CAST(:coach_id AS uuid), :code, :expires_at, 10)
        """),
        {"coach_id": user.id, "code": code, "expires_at": expires_at},
    )
    await db.commit()
    return CreateInviteResponse(code=code, expires_at=expires_at, max_uses=10)


@router.get("")
async def list_invites(
    user: CurrentUser = CoachUser,
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        text("""
            SELECT code, expires_at, max_uses, uses, created_at
            FROM coach_invites
            WHERE coach_id = CAST(:coach_id AS uuid)
            ORDER BY created_at DESC
            LIMIT 20
        """),
        {"coach_id": user.id},
    )
    return {
        "invites": [
            {
                "code": r.code,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "max_uses": r.max_uses,
                "uses": r.uses,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.post("/redeem")
async def redeem_invite(
    body: RedeemInviteBody,
    user: CurrentUser = AthleteUser,
    db: AsyncSession = Depends(get_db),
):
    athlete_row = await db.execute(
        text("SELECT id FROM athletes WHERE user_id = CAST(:uid AS uuid) LIMIT 1"),
        {"uid": user.id},
    )
    athlete = athlete_row.first()
    if not athlete:
        raise HTTPException(status_code=400, detail="Complete athlete profile first")

    athlete_id = str(athlete.id)
    code = body.code.strip().upper()

    invite_row = await db.execute(
        text("""
            SELECT id, coach_id, expires_at, max_uses, uses
            FROM coach_invites
            WHERE code = :code
        """),
        {"code": code},
    )
    invite = invite_row.first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite code expired")

    if invite.uses >= invite.max_uses:
        raise HTTPException(status_code=400, detail="Invite code has no uses remaining")

    existing = await db.execute(
        text("""
            SELECT 1 FROM coach_athlete
            WHERE coach_id = :coach_id AND athlete_id = CAST(:athlete_id AS uuid)
        """),
        {"coach_id": str(invite.coach_id), "athlete_id": athlete_id},
    )
    if existing.first():
        return {"ok": True, "message": "Already linked to this coach"}

    await db.execute(
        text("""
            INSERT INTO coach_athlete (coach_id, athlete_id)
            VALUES (CAST(:coach_id AS uuid), CAST(:athlete_id AS uuid))
            ON CONFLICT DO NOTHING
        """),
        {"coach_id": str(invite.coach_id), "athlete_id": athlete_id},
    )
    await db.execute(
        text("UPDATE coach_invites SET uses = uses + 1 WHERE id = :id"),
        {"id": str(invite.id)},
    )
    await db.commit()
    return {"ok": True, "coach_id": str(invite.coach_id)}
