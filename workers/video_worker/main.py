"""Video worker — sport-agnostic vision analysis → remember()."""

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

from memory.schemas import MemoryContent, MemoryEvidence, MemoryPayload, MemoryType
from memory.lifecycle import MemoryLifecycleService
from memory.cognee_client import CogneeMemoryClient
from workers.shared.video_analyzer import VideoSessionContext, analyze_video

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _download_from_minio(minio_key: str) -> str:
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
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    client.fget_object(bucket, minio_key, path)
    return path


async def process_video(session_id: str, asset_id: str, minio_key: str, context: dict) -> None:
    athlete_id = context.get("athlete_id")
    if not minio_key:
        raise ValueError("minio_key is required for video processing")
    if not athlete_id:
        raise ValueError("athlete_id is required for video processing")

    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    video_path = await asyncio.to_thread(_download_from_minio, minio_key)
    try:
        session_ctx = VideoSessionContext(
            sport=context.get("sport") or "unknown",
            athlete_id=athlete_id,
            session_id=session_id,
            athlete_name=context.get("athlete_name"),
            session_title=context.get("session_title"),
            description=context.get("description"),
            original_filename=context.get("original_filename"),
            asset_id=asset_id,
        )
        analysis = await asyncio.to_thread(analyze_video, video_path, session_ctx)
    finally:
        if os.path.exists(video_path):
            os.unlink(video_path)

    payload = MemoryPayload(
        athlete_id=athlete_id,
        session_id=session_id,
        sport=session_ctx.sport,
        athlete_name=session_ctx.athlete_name,
        session_title=session_ctx.session_title,
        description=session_ctx.description,
        asset_filename=session_ctx.original_filename,
        memory_type=MemoryType.PERFORMANCE_METRIC,
        source_worker="video_worker",
        content=MemoryContent(
            summary=analysis.summary,
            metrics=analysis.metrics,
            entities=analysis.entities,
        ),
        evidence=MemoryEvidence(asset_id=asset_id),
    )
    await lifecycle.ingest_worker_output(payload)
    logger.info("Video worker → remember() for session %s (%s)", session_id, session_ctx.sport)


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
            session_id = p.get("session_id")
            asset_id = p.get("asset_id")
            minio_key = p.get("minio_key")
            athlete_id = p.get("athlete_id")

            if not all([session_id, asset_id, minio_key, athlete_id]):
                logger.error("Skipping message — session_id, asset_id, minio_key, athlete_id required")
                continue

            try:
                await process_video(session_id, asset_id, minio_key, p)
            except Exception as e:
                logger.exception("Video processing failed: %s", e)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
