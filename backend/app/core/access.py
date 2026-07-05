from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import CurrentUser


async def get_athlete_id_for_user(db: AsyncSession, user: CurrentUser) -> str | None:
    if user.role != "athlete":
        return None
    row = await db.execute(
        text("SELECT id FROM athletes WHERE user_id = CAST(:uid AS uuid) LIMIT 1"),
        {"uid": user.id},
    )
    result = row.first()
    return str(result.id) if result else None


async def assert_athlete_access(db: AsyncSession, user: CurrentUser, athlete_id: str) -> None:
    if user.role == "athlete":
        own = await get_athlete_id_for_user(db, user)
        if own != athlete_id:
            raise HTTPException(status_code=403, detail="Access denied to this athlete")
        return

    if user.role == "coach":
        row = await db.execute(
            text("""
                SELECT 1 FROM coach_athlete
                WHERE coach_id = CAST(:coach_id AS uuid)
                  AND athlete_id = CAST(:athlete_id AS uuid)
            """),
            {"coach_id": user.id, "athlete_id": athlete_id},
        )
        if not row.first():
            raise HTTPException(status_code=403, detail="Athlete not linked to this coach")
        return

    raise HTTPException(status_code=403, detail="Insufficient permissions")


async def list_accessible_athlete_ids(db: AsyncSession, user: CurrentUser) -> list[str] | None:
    """Return athlete IDs the user may access. None means unrestricted (admin)."""
    if user.role == "coach":
        rows = await db.execute(
            text("""
                SELECT athlete_id FROM coach_athlete
                WHERE coach_id = CAST(:coach_id AS uuid)
            """),
            {"coach_id": user.id},
        )
        return [str(r.athlete_id) for r in rows]

    if user.role == "athlete":
        own = await get_athlete_id_for_user(db, user)
        return [own] if own else []

    if user.role in ("admin", "scout"):
        return None

    return []
