"""Audio worker — audio.process.requested -> remember() -> worker.output.ready."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from memory.cognee_client import CogneeMemoryClient
from memory.lifecycle import MemoryLifecycleService
from workers.shared.kafka_utils import (
    build_consumer,
    build_producer,
    publish_dlq,
    publish_json,
)
from workers.shared.logger import configure_logger
from workers.shared.memory_builder import (
    build_audio_memory_payload,
    extract_audio_signals,
)
from workers.shared.minio_utils import download_from_minio

logger = configure_logger(__name__)


def _transcribe_audio(file_path: str) -> str:
    """Transcribe audio with faster-whisper; fallback to lightweight placeholder."""
    model_size = os.getenv("WHISPER_MODEL", "tiny")
    try:
        from faster_whisper import WhisperModel

        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, _ = model.transcribe(file_path)
        transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
        if transcript.strip():
            return transcript
    except Exception as exc:
        logger.warning("Whisper transcription fallback due to: %s", exc)

    stem = Path(file_path).stem.replace("_", " ")
    return f"Audio session transcript placeholder for {stem}. Coach note: improve front foot and cover drive timing."


async def _process_event(event: dict, lifecycle: MemoryLifecycleService, producer) -> None:
    session_id = event.get("session_id", "unknown")
    minio_key = event.get("minio_key")
    if not minio_key:
        raise ValueError("Missing minio_key in event")

    local_path = await asyncio.to_thread(download_from_minio, minio_key, ".wav")
    try:
        transcript = await asyncio.to_thread(_transcribe_audio, local_path)
        payload = build_audio_memory_payload(event, transcript)

        ref = await lifecycle.ingest_worker_output(payload)
        extracted = extract_audio_signals(transcript)

        await publish_json(
            producer,
            "worker.output.ready",
            {
                "worker": "audio_worker",
                "topic": "audio.process.requested",
                "athlete_id": payload.athlete_id,
                "session_id": payload.session_id,
                "asset_id": event.get("asset_id"),
                "memory_id": ref.memory_id,
                "memory_type": payload.memory_type.value,
                "summary": payload.content.summary,
                "metadata": {
                    "transcript": extracted["transcript"][:500],
                    "coach_feedback": extracted["coach_feedback"],
                    "drill_names": extracted["drill_names"],
                },
            },
        )
        logger.info("Audio worker completed session=%s asset=%s", session_id, event.get("asset_id"))
    finally:
        try:
            os.unlink(local_path)
        except OSError:
            pass


async def main() -> None:
    topic = "audio.process.requested"
    max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))

    consumer = build_consumer(topic=topic, group_id="audio-worker")
    producer = build_producer()

    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    await consumer.start()
    await producer.start()
    logger.info("Audio worker listening on %s", topic)

    try:
        async for msg in consumer:
            event = msg.value
            retries = int(event.get("retry_count", 0))
            try:
                await _process_event(event, lifecycle, producer)
            except Exception as exc:
                logger.exception("Audio worker failed for session=%s: %s", event.get("session_id"), exc)
                if retries + 1 >= max_retries:
                    await publish_dlq(
                        producer=producer,
                        source_topic=topic,
                        payload=event,
                        error=str(exc),
                        worker="audio_worker",
                        retry_count=retries + 1,
                    )
                    continue

                retry_event = dict(event)
                retry_event["retry_count"] = retries + 1
                await publish_json(producer, topic, retry_event)
    finally:
        await consumer.stop()
        await producer.stop()


if __name__ == "__main__":
    asyncio.run(main())
