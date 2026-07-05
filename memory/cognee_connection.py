"""Bootstrap Cognee Cloud connection or embedded local SDK."""

from __future__ import annotations

import logging
import os

from memory.env_loader import load_project_env

load_project_env(override=True)

import cognee

logger = logging.getLogger(__name__)

_connected = False


def cognee_mode() -> str:
    explicit = os.getenv("COGNEE_MODE", "").strip().lower()
    if explicit:
        return explicit
    base_url = os.getenv("COGNEE_BASE_URL", "").strip()
    api_key = os.getenv("COGNEE_API_KEY", "").strip()
    if base_url and api_key:
        return "cloud"
    return "embedded"


def is_cognee_cloud() -> bool:
    return cognee_mode() == "cloud"


async def connect_cognee() -> None:
    """Connect to Cognee Cloud when COGNEE_MODE=cloud; embedded mode is a no-op."""
    global _connected

    if not is_cognee_cloud():
        logger.info("Cognee embedded mode — using local SDK")
        return

    base_url = os.getenv("COGNEE_BASE_URL", "").strip()
    api_key = os.getenv("COGNEE_API_KEY", "").strip()

    if not base_url or not api_key:
        raise RuntimeError(
            "COGNEE_MODE=cloud requires COGNEE_BASE_URL and COGNEE_API_KEY in .env"
        )

    await cognee.serve(url=base_url, api_key=api_key)
    _connected = True
    logger.info("Connected to Cognee Cloud at %s", base_url)


async def disconnect_cognee() -> None:
    """Disconnect from Cognee Cloud on shutdown."""
    global _connected

    if not _connected:
        return

    await cognee.disconnect()
    _connected = False
    logger.info("Disconnected from Cognee Cloud")
