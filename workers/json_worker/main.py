"""JSON worker — processes wearable/GPS/HR payloads → remember()."""

from __future__ import annotations

import asyncio
import json
import logging
import os

from aiokafka import AIOKafkaConsumer

from memory.schemas import MemoryContent, MemoryPayload, MemoryType
from memory.lifecycle import MemoryLifecycleService
from memory.cognee_client import CogneeMemoryClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


async def process_json_payload(session_id: str, asset_id: str, data: dict) -> None:
    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    gps = data.get("gps", {})
    hr = data.get("heart_rate", data.get("hr", {}))
    accel = data.get("acceleration", {})

    summary_parts = []
    metrics = {}

    if gps:
        dist = gps.get("distance_km", gps.get("distance", 0))
        summary_parts.append(f"GPS: {dist}km covered")
        metrics["distance_km"] = dist
    if hr:
        peak = hr.get("peak", hr.get("max", 0))
        avg = hr.get("average", hr.get("avg", 0))
        summary_parts.append(f"Heart rate peak {peak} bpm, avg {avg} bpm")
        metrics["peak_hr"] = peak
        metrics["avg_hr"] = avg
    if accel:
        metrics["max_acceleration"] = accel.get("max", 0)
        summary_parts.append(f"Max acceleration {metrics['max_acceleration']} m/s²")

    summary = "; ".join(summary_parts) or json.dumps(data)[:200]

    payload = MemoryPayload(
        athlete_id=data.get("athlete_id", DEMO_ATHLETE_ID),
        session_id=session_id,
        memory_type=MemoryType.WEARABLE,
        source_worker="json_worker",
        content=MemoryContent(
            summary=summary,
            metrics=metrics,
            entities=[f"athlete:{data.get('athlete_id', DEMO_ATHLETE_ID)}"],
        ),
    )
    await lifecycle.ingest_worker_output(payload)
    logger.info("JSON worker → remember() for session %s", session_id)


async def main() -> None:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    consumer = AIOKafkaConsumer(
        "json.process.requested",
        bootstrap_servers=servers,
        group_id="json-worker",
        value_deserializer=lambda m: json.loads(m.decode()),
        auto_offset_reset="earliest",
    )
    await consumer.start()
    logger.info("JSON worker listening on json.process.requested")

    try:
        async for msg in consumer:
            payload = msg.value
            session_id = payload.get("session_id", "unknown")
            asset_id = payload.get("asset_id", "unknown")
            # In production: fetch from MinIO; for MVP process inline demo data
            demo_data = payload.get("data") or {
                "athlete_id": DEMO_ATHLETE_ID,
                "gps": {"distance_km": 4.2},
                "heart_rate": {"peak": 178, "average": 142},
                "acceleration": {"max": 3.8},
            }
            await process_json_payload(session_id, asset_id, demo_data)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
