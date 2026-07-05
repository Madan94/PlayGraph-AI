import asyncio
import httpx
from sqlalchemy import text
from backend.app.infrastructure.database import async_session


async def test_db():
    async with async_session() as db:
        await db.execute(text("SELECT 1"))
    print("db ok")


async def main():
    await test_db()
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "http://localhost:8002/api/v1/auth/otp/request",
            json={"email": "test@example.com", "purpose": "signup", "role": "coach"},
            headers={"X-Internal-Key": "kshgruhyegruhuieueyyry73898yerufheuiubfuifeguiguiegbi"},
        )
        print("status", r.status_code)
        print(r.text[:500])


asyncio.run(main())
