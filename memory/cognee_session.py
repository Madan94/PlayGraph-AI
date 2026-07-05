"""Serialize Cognee/Ladybug access within the PlayGraph backend process."""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from memory.env_loader import load_project_env

load_project_env()

from memory.cognee_connection import is_cognee_cloud

logger = logging.getLogger(__name__)

_READ_LOCK_TIMEOUT = float(os.getenv("COGNEE_READ_LOCK_TIMEOUT_SECONDS", "120"))
_WRITE_LOCK_TIMEOUT = float(os.getenv("COGNEE_WRITE_LOCK_TIMEOUT_SECONDS", "600"))
_TEARDOWN_TIMEOUT = float(os.getenv("COGNEE_TEARDOWN_TIMEOUT_SECONDS", "30"))

_process_lock = asyncio.Lock()


class CogneeLockTimeoutError(TimeoutError):
    """Raised when Cognee is busy with another memory operation."""


async def _close_cached_engine(engine) -> None:
    if hasattr(engine, "close"):
        result = engine.close()
        if asyncio.iscoroutine(result):
            await result


async def release_cognee_engines() -> None:
    """Close cached subprocess graph/vector engines so Ladybug releases file locks."""
    try:
        from cognee.infrastructure.databases.dataset_queue.queue import dataset_queue

        await dataset_queue()._teardown_subprocess_engines()
        return
    except Exception:
        logger.debug("Dataset queue teardown unavailable; falling back to direct engine close", exc_info=True)

    try:
        from cognee.infrastructure.databases.graph.config import get_graph_context_config
        from cognee.infrastructure.databases.graph.get_graph_engine import (
            create_graph_engine,
            evict_graph_engine,
            is_graph_engine_cached,
        )
        from cognee.infrastructure.databases.vector.config import get_vectordb_context_config
        from cognee.infrastructure.databases.vector.create_vector_engine import (
            create_vector_engine,
            evict_vector_engine,
            is_vector_engine_cached,
        )

        g_cfg = get_graph_context_config()
        if g_cfg.get("graph_database_subprocess_enabled") and is_graph_engine_cached(**g_cfg):
            engine = create_graph_engine(**g_cfg)
            evict_graph_engine(**g_cfg)
            await _close_cached_engine(engine)

        v_cfg = get_vectordb_context_config()
        if v_cfg.get("vector_db_subprocess_enabled") and is_vector_engine_cached(**v_cfg):
            engine = create_vector_engine(**v_cfg)
            evict_vector_engine(**v_cfg)
            await _close_cached_engine(engine)
    except Exception:
        logger.warning("Failed to tear down Cognee subprocess engines", exc_info=True)


@asynccontextmanager
async def cognee_exclusive(*, write: bool = False):
    """
    Exclusive access to Cognee inside the backend process (embedded mode only).

    Workers must use ``memory.ingest_client`` (HTTP) instead of calling Cognee
    directly — Ladybug does not support multi-process access on Windows.

    In cloud mode this is a no-op; Cognee Cloud handles concurrency remotely.
    """
    if is_cognee_cloud():
        yield
        return

    timeout = _WRITE_LOCK_TIMEOUT if write else _READ_LOCK_TIMEOUT
    try:
        await asyncio.wait_for(_process_lock.acquire(), timeout=timeout)
    except asyncio.TimeoutError as exc:
        raise CogneeLockTimeoutError(
            f"Timed out waiting for Cognee ({timeout}s). "
            "Memory ingest or recall is still running — try again shortly."
        ) from exc

    try:
        yield
    finally:
        try:
            await asyncio.wait_for(release_cognee_engines(), timeout=_TEARDOWN_TIMEOUT)
        except asyncio.TimeoutError:
            logger.warning(
                "Cognee engine teardown exceeded %ss",
                _TEARDOWN_TIMEOUT,
            )
        except Exception:
            logger.warning("Cognee engine teardown failed", exc_info=True)
        _process_lock.release()
