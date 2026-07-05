"""Serialize Cognee/Ladybug access across PlayGraph backend and workers."""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from filelock import FileLock, Timeout as FileLockTimeout

from memory.env_loader import REPO_ROOT

logger = logging.getLogger(__name__)

_LOCK_TIMEOUT = float(os.getenv("COGNEE_LOCK_TIMEOUT_SECONDS", "180"))


class CogneeLockTimeoutError(TimeoutError):
    """Raised when another process holds the shared Cognee file lock too long."""


def _lock_path() -> Path:
    system_root = Path(os.getenv("SYSTEM_ROOT_DIRECTORY", REPO_ROOT / ".cognee_system"))
    system_root.mkdir(parents=True, exist_ok=True)
    return system_root / ".playgraph_cognee.lock"


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
async def cognee_exclusive():
    """
    Exclusive access to the local Cognee graph DB.

    Ladybug allows only one process to open ``cognee_graph_ladybug`` at a time.
    Backend, workers, and Cognee CLI share the same paths on disk — this lock
    serializes them and releases engines when each operation finishes.
    """
    lock = FileLock(str(_lock_path()))
    acquired = False
    try:
        await asyncio.to_thread(lock.acquire, timeout=_LOCK_TIMEOUT)
        acquired = True
        yield
    except FileLockTimeout as exc:
        raise CogneeLockTimeoutError(
            f"Timed out waiting for Cognee lock ({_LOCK_TIMEOUT}s). "
            "Another PlayGraph worker may be ingesting a video, or Cognee CLI is open."
        ) from exc
    finally:
        if acquired:
            await release_cognee_engines()
            await asyncio.to_thread(lock.release)
