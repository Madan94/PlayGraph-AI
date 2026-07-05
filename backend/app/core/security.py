from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.infrastructure.database import get_db


@dataclass
class CurrentUser:
    id: str
    email: str
    role: str
    full_name: str | None
    jti: str


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp(length: int | None = None) -> str:
    n = length or settings.otp_length
    return "".join(secrets.choice("0123456789") for _ in range(n))


def generate_jti() -> str:
    return uuid.uuid4().hex


def create_access_token(*, user_id: str, email: str, role: str, jti: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "jti": jti,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:].strip()


async def get_token_from_request(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    token = _extract_bearer_token(authorization)
    if not token:
        token = request.cookies.get(settings.jwt_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    token = await get_token_from_request(request, authorization)
    try:
        payload = decode_access_token(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user_id = payload.get("sub")
    jti = payload.get("jti")
    if not user_id or not jti:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    session_row = await db.execute(
        text("""
            SELECT revoked_at, expires_at
            FROM auth_sessions
            WHERE jti = :jti AND user_id = CAST(:user_id AS uuid)
        """),
        {"jti": jti, "user_id": user_id},
    )
    session = session_row.first()
    if not session or session.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Session revoked")
    if session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_row = await db.execute(
        text("SELECT id, email, role, full_name FROM users WHERE id = CAST(:id AS uuid)"),
        {"id": user_id},
    )
    user = user_row.first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return CurrentUser(
        id=str(user.id),
        email=user.email,
        role=str(user.role),
        full_name=user.full_name,
        jti=jti,
    )


def require_role(*roles: str):
    async def _checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _checker


def verify_internal_service_key(
    x_internal_key: Annotated[str | None, Header(alias="X-Internal-Key")] = None,
) -> None:
    if not settings.auth_internal_service_key:
        raise HTTPException(status_code=503, detail="Internal auth key not configured")
    if x_internal_key != settings.auth_internal_service_key:
        raise HTTPException(status_code=403, detail="Forbidden")
