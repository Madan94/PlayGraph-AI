from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.infrastructure.event_bus import event_bus

router = APIRouter(prefix="/memory", tags=["memory-stream"])


@router.get("/stream")
async def memory_stream(user: CurrentUser = Depends(get_current_user)):
    """SSE endpoint for Live Memory Panel — hackathon centerpiece."""

    async def generator():
        # Send history first
        for event in event_bus.history:
            yield event.to_sse()
            await asyncio.sleep(0.05)

        q = event_bus.subscribe()
        try:
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield event.to_sse()
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'op': 'heartbeat', 'at': 'keepalive'})}\n\n"
        finally:
            event_bus.unsubscribe(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
