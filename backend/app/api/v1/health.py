import os
from pathlib import Path

from fastapi import APIRouter

from backend.app.core.config import settings
from memory.cognee_connection import is_cognee_cloud

router = APIRouter(tags=["health"])


def _cognee_runtime_info() -> dict:
    data_root = os.getenv("DATA_ROOT_DIRECTORY", "")
    system_root = os.getenv("SYSTEM_ROOT_DIRECTORY", "")
    cloud = is_cognee_cloud()

    info: dict = {
        "mode": "cloud" if cloud else "embedded_sdk",
        "description": (
            "Cognee Cloud tenant via cognee.serve()"
            if cloud
            else "Cognee runs in-process via pip package `cognee` (not cloud, not CLI)"
        ),
        "dataset": settings.cognee_dataset,
        "dataset_pattern": "{COGNEE_DATASET}_{athlete_id}",
    }

    if cloud:
        base_url = settings.cognee_base_url or os.getenv("COGNEE_BASE_URL", "")
        info["cloud_base_url"] = base_url
        info["cloud_connected"] = bool(base_url and settings.cognee_api_key)
    else:
        info.update(
            {
                "data_root_directory": data_root,
                "system_root_directory": system_root,
                "data_root_exists": Path(data_root).is_dir() if data_root else False,
                "system_root_exists": Path(system_root).is_dir() if system_root else False,
                "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
                "llm_model": os.getenv("LLM_MODEL", ""),
            }
        )

    return info


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "nextplay-backend",
        "cognee": _cognee_runtime_info(),
    }


@router.get("/ready")
async def ready():
    info = _cognee_runtime_info()
    if is_cognee_cloud():
        ready = info.get("cloud_connected", False)
        message = (
            "Intelligence layer is Cognee Cloud"
            if ready
            else "Cognee Cloud credentials missing — set COGNEE_BASE_URL and COGNEE_API_KEY"
        )
    else:
        ready = info["data_root_exists"] and info["system_root_exists"]
        message = "Intelligence layer is local embedded Cognee SDK — no cloud fallback"

    return {
        "status": "ready" if ready else "degraded",
        "cognee": info,
        "message": message,
    }
