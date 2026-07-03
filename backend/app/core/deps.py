from __future__ import annotations

from memory.cognee_client import CogneeMemoryClient
from memory.lifecycle import MemoryLifecycleService
from backend.app.infrastructure.event_bus import event_bus


async def _on_lifecycle(event) -> None:
    await event_bus.publish(event)


_memory_client: CogneeMemoryClient | None = None
_lifecycle_service: MemoryLifecycleService | None = None


def get_memory_client() -> CogneeMemoryClient:
    global _memory_client
    if _memory_client is None:
        from backend.app.core.config import settings
        _memory_client = CogneeMemoryClient(
            dataset=settings.cognee_dataset,
            on_lifecycle=_on_lifecycle,
        )
    return _memory_client


def get_lifecycle_service() -> MemoryLifecycleService:
    global _lifecycle_service
    if _lifecycle_service is None:
        _lifecycle_service = MemoryLifecycleService(get_memory_client())
    return _lifecycle_service
