import os
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(tags=["health"])


def _cognee_runtime_info() -> dict:
    data_root = os.getenv("DATA_ROOT_DIRECTORY", "")
    system_root = os.getenv("SYSTEM_ROOT_DIRECTORY", "")
    return {
        "mode": "embedded_sdk",
        "description": "Cognee runs in-process via pip package `cognee` (not cloud, not CLI)",
        "dataset": os.getenv("COGNEE_DATASET", "nextplay_ai"),
        "dataset_pattern": "{COGNEE_DATASET}_{athlete_id}",
        "data_root_directory": data_root,
        "system_root_directory": system_root,
        "data_root_exists": Path(data_root).is_dir() if data_root else False,
        "system_root_exists": Path(system_root).is_dir() if system_root else False,
        "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
        "llm_model": os.getenv("LLM_MODEL", ""),
    }


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
    paths_ok = info["data_root_exists"] and info["system_root_exists"]
    return {
        "status": "ready" if paths_ok else "degraded",
        "cognee": info,
        "message": "Intelligence layer is local embedded Cognee SDK — no cloud fallback",
    }
