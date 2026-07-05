"""POST worker memory payloads to the PlayGraph backend (sole Cognee process)."""

from __future__ import annotations

import asyncio
import logging
import os

import httpx

from memory.schemas import MemoryPayload

logger = logging.getLogger(__name__)

_CONNECT_TIMEOUT = float(os.getenv("PLAYGRAPH_INGEST_CONNECT_TIMEOUT_SECONDS", "30"))
_REQUEST_TIMEOUT = float(os.getenv("PLAYGRAPH_INGEST_REQUEST_TIMEOUT_SECONDS", "60"))
_MAX_RETRIES = int(os.getenv("PLAYGRAPH_INGEST_RETRIES", "3"))


def _api_base() -> str:
    return os.getenv("PLAYGRAPH_API_URL", "http://localhost:8002").rstrip("/")


async def ingest_via_backend(payload: MemoryPayload) -> dict:
    """Queue memory ingest on the backend (202 Accepted — Cognee runs async)."""
    url = f"{_api_base()}/api/v1/memory/ingest"
    body = payload.model_dump(mode="json")
    timeout = httpx.Timeout(_REQUEST_TIMEOUT, connect=_CONNECT_TIMEOUT)
    internal_key = os.getenv("AUTH_INTERNAL_SERVICE_KEY", "")
    headers = {"X-Internal-Key": internal_key} if internal_key else {}

    last_error: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, json=body, headers=headers)
                response.raise_for_status()
                data = response.json()
                logger.info(
                    "Memory ingest accepted by backend for athlete=%s session=%s (attempt %d)",
                    payload.athlete_id,
                    payload.session_id,
                    attempt,
                )
                return data
        except (httpx.ReadError, httpx.ConnectError, httpx.RemoteProtocolError) as exc:
            last_error = exc
            if attempt >= _MAX_RETRIES:
                break
            wait_s = 2 ** attempt
            logger.warning(
                "Backend ingest request failed (%s), retrying in %ss (attempt %d/%d)",
                exc,
                wait_s,
                attempt,
                _MAX_RETRIES,
            )
            await asyncio.sleep(wait_s)

    raise RuntimeError(
        f"Failed to reach PlayGraph backend at {_api_base()} after {_MAX_RETRIES} attempts"
    ) from last_error
