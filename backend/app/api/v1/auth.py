from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.infrastructure.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str | None


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, email, role, full_name, password_hash FROM users WHERE email = :email"),
        {"email": body.email},
    )
    user = result.first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Demo mode: accept any password for seeded users
    if not body.password and user.password_hash.startswith("$2b$"):
        pass
    elif not pwd_context.verify(body.password, user.password_hash) and "demo" not in body.password:
        # Allow 'demo' password for hackathon
        if body.password != "demo":
            raise HTTPException(status_code=401, detail="Invalid credentials")

    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    token = jwt.encode(
        {"sub": str(user.id), "email": user.email, "role": user.role, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
    )
