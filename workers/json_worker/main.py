"""JSON worker — processes wearable/GPS/HR payloads → backend memory ingest."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path

from memory.env_loader import load_project_env

load_project_env()

from aiokafka import AIOKafkaConsumer

from memory.ingest_client import ingest_via_backend
from memory.schemas import MemoryContent, MemoryPayload, MemoryType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _download_json_from_minio(minio_key: str) -> dict:
    from minio import Minio

    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    client = Minio(
        endpoint,
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )
    bucket = os.getenv("MINIO_BUCKET", "nextplay-assets")
    suffix = Path(minio_key).suffix or ".json"
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    try:
        client.fget_object(bucket, minio_key, path)
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    finally:
        if os.path.exists(path):
            os.unlink(path)


async def process_json_payload(session_id: str, asset_id: str, data: dict, context: dict) -> None:
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

    if not summary_parts and not metrics:
        raise ValueError("JSON payload contains no recognizable wearable metrics")

    summary = "; ".join(summary_parts) or json.dumps(data)[:200]
    resolved_athlete = data.get("athlete_id") or context.get("athlete_id")
    if not resolved_athlete:
        raise ValueError("athlete_id is required in Kafka payload or JSON data")

    sport = context.get("sport") or "unknown"
    entities = [
        f"athlete:{resolved_athlete}",
        f"sport:{sport}",
        f"session:{session_id}",
    ]

    payload = MemoryPayload(
        athlete_id=resolved_athlete,
        session_id=session_id,
        sport=sport,
        athlete_name=context.get("athlete_name"),
        session_title=context.get("session_title"),
        description=context.get("description"),
        asset_filename=context.get("original_filename"),
        memory_type=MemoryType.WEARABLE,
        source_worker="json_worker",
        content=MemoryContent(summary=summary, metrics=metrics, entities=entities),
    )
    await ingest_via_backend(payload)
    logger.info("JSON worker → ingest for session %s", session_id)


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
            session_id = payload.get("session_id")
            asset_id = payload.get("asset_id")
            athlete_id = payload.get("athlete_id")
            minio_key = payload.get("minio_key")

            if not session_id or not asset_id:
                logger.error("Skipping message — session_id and asset_id are required")
                continue
            if not athlete_id:
                logger.error("Skipping message — athlete_id is required")
                continue

            if payload.get("data"):
                data = payload["data"]
            elif minio_key:
                data = await asyncio.to_thread(_download_json_from_minio, minio_key)
            else:
                logger.error("Skipping message — provide minio_key or inline data")
                continue

            await process_json_payload(session_id, asset_id, data, payload)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
