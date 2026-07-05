from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import (
    CurrentUser,
    create_access_token,
    generate_jti,
    generate_otp,
    get_current_user,
    hash_otp,
    verify_internal_service_key,
)
from backend.app.infrastructure.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class OtpRequestBody(BaseModel):
    email: EmailStr
    purpose: str = Field(pattern="^(signup|login)$")
    role: str = Field(pattern="^(athlete|coach)$")


class OtpRequestResponse(BaseModel):
    sent: bool = True
    otp_code: str | None = None


class OtpVerifyBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    purpose: str = Field(pattern="^(signup|login)$")
    role: str = Field(pattern="^(athlete|coach)$")
    full_name: str | None = None
    sport: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str | None
    athlete_id: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class OnboardingBody(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    sport: str = Field(default="athletics", max_length=64)


async def _get_athlete_id(db: AsyncSession, user_id: str) -> str | None:
    row = await db.execute(
        text("SELECT id FROM athletes WHERE user_id = CAST(:uid AS uuid) LIMIT 1"),
        {"uid": user_id},
    )
    result = row.first()
    return str(result.id) if result else None


async def _user_response(db: AsyncSession, user_id: str, email: str, role: str, full_name: str | None) -> UserResponse:
    athlete_id = await _get_athlete_id(db, user_id) if role == "athlete" else None
    return UserResponse(
        id=user_id,
        email=email,
        role=role,
        full_name=full_name,
        athlete_id=athlete_id,
    )


@router.post("/otp/request", response_model=OtpRequestResponse)
async def request_otp(
    body: OtpRequestBody,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_internal_service_key),
):
    email = body.email.lower().strip()
    existing = await db.execute(
        text("SELECT id, role FROM users WHERE email = :email"),
        {"email": email},
    )
    user = existing.first()

    if body.purpose == "signup":
        if user:
            raise HTTPException(status_code=409, detail="Account already exists. Use login instead.")
    elif body.purpose == "login":
        if not user:
            raise HTTPException(status_code=404, detail="No account found. Sign up first.")
        if str(user.role) != body.role:
            raise HTTPException(status_code=403, detail=f"Account is registered as {user.role}")

    code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_ttl_minutes)

    await db.execute(
        text("""
            INSERT INTO otp_requests (email, code_hash, purpose, role, expires_at)
            VALUES (:email, :code_hash, CAST(:purpose AS otp_purpose), CAST(:role AS user_role), :expires_at)
        """),
        {
            "email": email,
            "code_hash": hash_otp(code),
            "purpose": body.purpose,
            "role": body.role,
            "expires_at": expires_at,
        },
    )
    await db.commit()
    return OtpRequestResponse(sent=True, otp_code=code)


@router.post("/otp/verify", response_model=AuthResponse)
async def verify_otp(body: OtpVerifyBody, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    otp_row = await db.execute(
        text("""
            SELECT id, code_hash, attempts, expires_at, consumed_at
            FROM otp_requests
            WHERE email = :email
              AND purpose = CAST(:purpose AS otp_purpose)
              AND role = CAST(:role AS user_role)
              AND consumed_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"email": email, "purpose": body.purpose, "role": body.role},
    )
    otp = otp_row.first()
    if not otp:
        raise HTTPException(status_code=400, detail="No active OTP. Request a new code.")

    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Request a new code.")

    if otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(status_code=400, detail="Too many attempts. Request a new code.")

    if hash_otp(body.code.strip()) != otp.code_hash:
        await db.execute(
            text("UPDATE otp_requests SET attempts = attempts + 1 WHERE id = :id"),
            {"id": str(otp.id)},
        )
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    await db.execute(
        text("UPDATE otp_requests SET consumed_at = NOW() WHERE id = :id"),
        {"id": str(otp.id)},
    )

    user_row = await db.execute(
        text("SELECT id, email, role, full_name FROM users WHERE email = :email"),
        {"email": email},
    )
    user = user_row.first()

    if body.purpose == "signup":
        if user:
            raise HTTPException(status_code=409, detail="Account already exists")
        if not body.full_name or not body.full_name.strip():
            raise HTTPException(status_code=400, detail="full_name is required for signup")

        user_id = str(uuid.uuid4())
        await db.execute(
            text("""
                INSERT INTO users (id, email, role, full_name)
                VALUES (CAST(:id AS uuid), :email, CAST(:role AS user_role), :full_name)
            """),
            {
                "id": user_id,
                "email": email,
                "role": body.role,
                "full_name": body.full_name.strip(),
            },
        )

        if body.role == "athlete":
            athlete_id = str(uuid.uuid4())
            sport = (body.sport or "athletics").strip()
            await db.execute(
                text("""
                    INSERT INTO athletes (id, user_id, name, sport, metadata)
                    VALUES (
                        CAST(:id AS uuid),
                        CAST(:user_id AS uuid),
                        :name,
                        :sport,
                        '{}'::jsonb
                    )
                """),
                {
                    "id": athlete_id,
                    "user_id": user_id,
                    "name": body.full_name.strip(),
                    "sport": sport,
                },
            )

        email_val = email
        role_val = body.role
        full_name_val = body.full_name.strip()
    else:
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = str(user.id)
        email_val = user.email
        role_val = str(user.role)
        full_name_val = user.full_name

    jti = generate_jti()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    await db.execute(
        text("""
            INSERT INTO auth_sessions (user_id, jti, expires_at)
            VALUES (CAST(:user_id AS uuid), :jti, :expires_at)
        """),
        {"user_id": user_id, "jti": jti, "expires_at": expires_at},
    )
    await db.commit()

    token = create_access_token(
        user_id=user_id,
        email=email_val,
        role=role_val,
        jti=jti,
    )
    user_resp = await _user_response(db, user_id, email_val, role_val, full_name_val)
    return AuthResponse(access_token=token, user=user_resp)


@router.post("/logout")
async def logout(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE auth_sessions SET revoked_at = NOW() WHERE jti = :jti"),
        {"jti": user.jti},
    )
    await db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def me(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _user_response(db, user.id, user.email, user.role, user.full_name)


_DEMO_USERS: dict[str, dict] = {
    "rahul@nextplay.ai": {"role": "athlete", "full_name": "Rahul Sharma", "sport": "cricket"},
    "coach@nextplay.ai": {"role": "coach", "full_name": "Marcus Chen", "sport": None},
}
_DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


class LoginBody(BaseModel):
    email: EmailStr
    password: str  # ignored — any password works for demo


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str | None


@router.post("/login", response_model=LoginResponse)
async def demo_login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    """Password-less demo login. Creates the demo user + athlete on first call."""
    email = body.email.lower().strip()
    demo = _DEMO_USERS.get(email)

    user_row = await db.execute(
        text("SELECT id, role, full_name FROM users WHERE email = :email"),
        {"email": email},
    )
    user = user_row.first()

    if user is None:
        role = demo["role"] if demo else "athlete"
        full_name = (
            demo["full_name"] if demo
            else email.split("@")[0].replace(".", " ").title()
        )
        user_id = str(uuid.uuid4())

        await db.execute(
            text("""
                INSERT INTO users (id, email, role, full_name)
                VALUES (CAST(:id AS uuid), :email, CAST(:role AS user_role), :full_name)
            """),
            {"id": user_id, "email": email, "role": role, "full_name": full_name},
        )

        if role == "athlete":
            athlete_id = _DEMO_ATHLETE_ID if email == "rahul@nextplay.ai" else str(uuid.uuid4())
            sport = (demo or {}).get("sport") or "cricket"
            await db.execute(
                text("""
                    INSERT INTO athletes (id, user_id, name, sport, metadata)
                    VALUES (CAST(:id AS uuid), CAST(:user_id AS uuid), :name, :sport, '{}'::jsonb)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": athlete_id, "user_id": user_id, "name": full_name, "sport": sport},
            )
    else:
        user_id = str(user.id)
        role = str(user.role)
        full_name = user.full_name
        # Ensure the fixed demo athlete ID exists even if user was created earlier
        if email == "rahul@nextplay.ai":
            await db.execute(
                text("""
                    INSERT INTO athletes (id, user_id, name, sport, metadata)
                    VALUES (CAST(:id AS uuid), CAST(:user_id AS uuid), :name, :sport, '{}'::jsonb)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": _DEMO_ATHLETE_ID,
                    "user_id": user_id,
                    "name": full_name or "Rahul Sharma",
                    "sport": "cricket",
                },
            )

    if email == "coach@nextplay.ai":
        await db.execute(
            text("""
                INSERT INTO coach_athlete (coach_id, athlete_id)
                VALUES (CAST(:coach_id AS uuid), CAST(:athlete_id AS uuid))
                ON CONFLICT DO NOTHING
            """),
            {"coach_id": user_id, "athlete_id": _DEMO_ATHLETE_ID},
        )

    jti = generate_jti()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    await db.execute(
        text("""
            INSERT INTO auth_sessions (user_id, jti, expires_at)
            VALUES (CAST(:user_id AS uuid), :jti, :expires_at)
        """),
        {"user_id": user_id, "jti": jti, "expires_at": expires_at},
    )
    await db.commit()

    token = create_access_token(user_id=user_id, email=email, role=role, jti=jti)
    return LoginResponse(access_token=token, role=role, full_name=full_name)


@router.post("/onboarding", response_model=UserResponse)
async def athlete_onboarding(
    body: OnboardingBody,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "athlete":
        raise HTTPException(status_code=403, detail="Only athletes can complete onboarding")

    existing = await _get_athlete_id(db, user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Athlete profile already exists")

    athlete_id = str(uuid.uuid4())
    await db.execute(
        text("UPDATE users SET full_name = :name WHERE id = CAST(:id AS uuid)"),
        {"name": body.full_name.strip(), "id": user.id},
    )
    await db.execute(
        text("""
            INSERT INTO athletes (id, user_id, name, sport, metadata)
            VALUES (
                CAST(:id AS uuid),
                CAST(:user_id AS uuid),
                :name,
                :sport,
                '{}'::jsonb
            )
        """),
        {
            "id": athlete_id,
            "user_id": user.id,
            "name": body.full_name.strip(),
            "sport": body.sport.strip(),
        },
    )
    await db.commit()
    return await _user_response(db, user.id, user.email, user.role, body.full_name.strip())
