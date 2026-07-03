"""Video worker — frame extraction, cricket metrics → remember()."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path

from aiokafka import AIOKafkaConsumer

from memory.schemas import MemoryContent, MemoryPayload, MemoryType
from memory.lifecycle import MemoryLifecycleService
from memory.cognee_client import CogneeMemoryClient
from workers.shared.cricket_plugin import extract_cricket_metrics_from_video

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def _download_from_minio(minio_key: str) -> str | None:
    try:
        from minio import Minio
        endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        client = Minio(
            endpoint,
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
        )
        bucket = os.getenv("MINIO_BUCKET", "nextplay-assets")
        suffix = Path(minio_key).suffix or ".mp4"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        client.fget_object(bucket, minio_key, tmp.name)
        return tmp.name
    except Exception as e:
        logger.warning("MinIO download failed: %s — using simulated metrics", e)
        return None


async def process_video(session_id: str, asset_id: str, minio_key: str | None, athlete_id: str) -> None:
    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    video_path = None
    if minio_key:
        video_path = await asyncio.to_thread(_download_from_minio, minio_key)

    metrics_obj = await asyncio.to_thread(extract_cricket_metrics_from_video, video_path)
    if video_path and os.path.exists(video_path):
        os.unlink(video_path)

    summary = metrics_obj.to_summary()
    metrics = metrics_obj.to_metrics_dict()

    payload = MemoryPayload(
        athlete_id=athlete_id or DEMO_ATHLETE_ID,
        session_id=session_id,
        memory_type=MemoryType.PERFORMANCE_METRIC,
        source_worker="video_worker",
        content=MemoryContent(
            summary=summary,
            metrics=metrics,
            entities=[
                f"athlete:{athlete_id or DEMO_ATHLETE_ID}",
                "drill:batting",
                "drill:cover_drive",
                "sport:cricket",
            ],
        ),
    )
    await lifecycle.ingest_worker_output(payload)
    logger.info("Video worker → remember() cricket metrics for session %s", session_id)


async def main() -> None:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    consumer = AIOKafkaConsumer(
        "video.process.requested",
        bootstrap_servers=servers,
        group_id="video-worker",
        value_deserializer=lambda m: json.loads(m.decode()),
        auto_offset_reset="earliest",
    )
    await consumer.start()
    logger.info("Video worker listening on video.process.requested")

    try:
        async for msg in consumer:
            p = msg.value
            await process_video(
                session_id=p.get("session_id", "unknown"),
                asset_id=p.get("asset_id", "unknown"),
                minio_key=p.get("minio_key"),
                athlete_id=p.get("athlete_id", DEMO_ATHLETE_ID),
            )
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
