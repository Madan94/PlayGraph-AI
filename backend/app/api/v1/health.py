from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "service": "nextplay-backend"}


@router.get("/ready")
async def ready():
    return {
        "status": "ready",
        "cognee": "required",
        "message": "Intelligence layer must be Cognee — no fallback",
    }
