from __future__ import annotations

import asyncio
from collections import deque
from typing import AsyncGenerator

from memory.schemas import LifecycleEvent


class EventBus:
    """In-process pub/sub for memory lifecycle events → SSE."""

    def __init__(self, history_size: int = 100) -> None:
        self._subscribers: list[asyncio.Queue[LifecycleEvent]] = []
        self._history: deque[LifecycleEvent] = deque(maxlen=history_size)

    async def publish(self, event: LifecycleEvent) -> None:
        self._history.append(event)
        dead: list[asyncio.Queue[LifecycleEvent]] = []
        for q in self._subscribers:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self._subscribers.remove(q)

    def subscribe(self) -> asyncio.Queue[LifecycleEvent]:
        q: asyncio.Queue[LifecycleEvent] = asyncio.Queue(maxsize=256)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[LifecycleEvent]) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)

    @property
    def history(self) -> list[LifecycleEvent]:
        return list(self._history)


event_bus = EventBus()
