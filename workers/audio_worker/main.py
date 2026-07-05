"""Audio worker — transcribe recordings → backend memory ingest."""

from __future__ import annotations

import asyncio
import json
import logging
import os

from memory.env_loader import load_project_env

load_project_env()

from aiokafka import AIOKafkaConsumer

from memory.ingest_client import ingest_via_backend
from memory.schemas import MemoryContent, MemoryEvidence, MemoryPayload, MemoryType
from workers.shared.audio_llm import analyze_audio
from workers.shared.minio_utils import download_bytes_from_minio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def process_audio(session_id: str, asset_id: str, minio_key: str, context: dict) -> None:
    athlete_id = context.get("athlete_id")
    if not minio_key or not athlete_id:
        raise ValueError("minio_key and athlete_id are required")

    audio_bytes = await asyncio.to_thread(download_bytes_from_minio, minio_key)
    sport = context.get("sport") or "unknown"
    filename = context.get("original_filename") or "recording.webm"

    analysis = await asyncio.to_thread(
        analyze_audio,
        audio_bytes,
        filename=filename,
        sport=sport,
        athlete_name=context.get("athlete_name"),
        session_title=context.get("session_title"),
        description=context.get("description"),
    )

    metrics = {
        "transcript_length": len(analysis.get("transcript", "")),
        "_observations": analysis.get("observations", []),
    }
    payload = MemoryPayload(
        athlete_id=athlete_id,
        session_id=session_id,
        sport=sport,
        athlete_name=context.get("athlete_name"),
        session_title=context.get("session_title"),
        description=context.get("description"),
        asset_filename=filename,
        memory_type=MemoryType.TRANSCRIPT,
        source_worker="audio_worker",
        content=MemoryContent(
            summary=analysis["summary"],
            metrics=metrics,
            entities=analysis.get("entities", [f"sport:{sport}"]),
        ),
        evidence=MemoryEvidence(asset_id=asset_id),
    )
    await ingest_via_backend(payload)
    logger.info("Audio worker → ingest for session %s", session_id)


async def main() -> None:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    consumer = AIOKafkaConsumer(
        "audio.process.requested",
        bootstrap_servers=servers,
        group_id="audio-worker",
        value_deserializer=lambda m: json.loads(m.decode()),
        auto_offset_reset="earliest",
    )
    await consumer.start()
    logger.info("Audio worker listening on audio.process.requested")

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
                await process_audio(session_id, asset_id, minio_key, p)
            except Exception as e:
                logger.exception("Audio processing failed: %s", e)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
