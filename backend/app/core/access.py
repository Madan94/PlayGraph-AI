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


async def ensure_canonical_athlete_id(db: AsyncSession, user_id: str) -> str | None:
    """Return the athlete profile for this user, merging with coach roster if needed."""
    row = await db.execute(
        text("SELECT id FROM athletes WHERE user_id = CAST(:uid AS uuid) LIMIT 1"),
        {"uid": user_id},
    )
    own = row.first()
    if not own:
        return None

    own_id = str(own.id)
    roster_row = await db.execute(
        text("""
            SELECT a.id
            FROM athletes a
            JOIN coach_athlete ca ON ca.athlete_id = a.id
            WHERE ca.coach_id IN (
                SELECT coach_id FROM coach_athlete
                WHERE athlete_id = CAST(:own_id AS uuid)
            )
              AND a.user_id IS NULL
              AND a.id != CAST(:own_id AS uuid)
            ORDER BY (
                SELECT COUNT(*) FROM sessions s WHERE s.athlete_id = a.id
            ) DESC, a.created_at DESC
            LIMIT 1
        """),
        {"own_id": own_id},
    )
    roster = roster_row.first()
    if not roster:
        return own_id

    return await _merge_athlete_profiles(db, user_id, own_id, str(roster.id))


async def claim_coach_roster_athlete(
    db: AsyncSession,
    user_id: str,
    coach_id: str,
    own_id: str | None,
) -> str:
    """Claim an unclaimed coach roster athlete so uploads and timeline share one ID."""
    roster_row = await db.execute(
        text("""
            SELECT a.id
            FROM athletes a
            JOIN coach_athlete ca ON ca.athlete_id = a.id
            WHERE ca.coach_id = CAST(:coach_id AS uuid)
              AND a.user_id IS NULL
            ORDER BY (
                SELECT COUNT(*) FROM sessions s WHERE s.athlete_id = a.id
            ) DESC, a.created_at DESC
            LIMIT 1
        """),
        {"coach_id": coach_id},
    )
    roster = roster_row.first()
    if roster:
        roster_id = str(roster.id)
        if own_id and own_id != roster_id:
            return await _merge_athlete_profiles(db, user_id, own_id, roster_id)
        await db.execute(
            text("""
                UPDATE athletes SET user_id = CAST(:uid AS uuid)
                WHERE id = CAST(:rid AS uuid) AND user_id IS NULL
            """),
            {"uid": user_id, "rid": roster_id},
        )
        return roster_id

    if own_id:
        return own_id
    raise HTTPException(status_code=400, detail="Complete athlete profile first")


async def _merge_athlete_profiles(
    db: AsyncSession,
    user_id: str,
    duplicate_id: str,
    canonical_id: str,
) -> str:
    if duplicate_id == canonical_id:
        return canonical_id

    await db.execute(
        text("""
            UPDATE athletes SET user_id = CAST(:uid AS uuid)
            WHERE id = CAST(:rid AS uuid) AND user_id IS NULL
        """),
        {"uid": user_id, "rid": canonical_id},
    )
    await db.execute(
        text("""
            UPDATE sessions SET athlete_id = CAST(:canonical AS uuid)
            WHERE athlete_id = CAST(:duplicate AS uuid)
        """),
        {"canonical": canonical_id, "duplicate": duplicate_id},
    )
    await db.execute(
        text("""
            UPDATE memory_operations_log SET athlete_id = CAST(:canonical AS uuid)
            WHERE athlete_id = CAST(:duplicate AS uuid)
        """),
        {"canonical": canonical_id, "duplicate": duplicate_id},
    )
    await db.execute(
        text("DELETE FROM coach_athlete WHERE athlete_id = CAST(:duplicate AS uuid)"),
        {"duplicate": duplicate_id},
    )
    await db.execute(
        text("DELETE FROM athletes WHERE id = CAST(:duplicate AS uuid)"),
        {"duplicate": duplicate_id},
    )
    return canonical_id


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
