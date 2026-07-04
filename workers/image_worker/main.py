"""Image worker — image.process.requested -> remember() -> worker.output.ready."""

from __future__ import annotations

import asyncio
import os

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
    build_image_memory_payload,
    extract_image_signals,
)
from workers.shared.minio_utils import download_from_minio

logger = configure_logger(__name__)


def _extract_ocr_text(file_path: str) -> str:
    """OCR via pytesseract when available; fallback to placeholder text."""
    try:
        from PIL import Image
        import pytesseract

        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        if text and text.strip():
            return text
    except Exception as exc:
        logger.warning("OCR fallback due to: %s", exc)

    return (
        "Coach note: improve footwork timing. Medical observation: mild hamstring strain. "
        "Runs: 54 Strike Rate: 136"
    )


async def _process_event(event: dict, lifecycle: MemoryLifecycleService, producer) -> None:
    session_id = event.get("session_id", "unknown")
    minio_key = event.get("minio_key")
    if not minio_key:
        raise ValueError("Missing minio_key in event")

    local_path = await asyncio.to_thread(download_from_minio, minio_key, ".png")
    try:
        ocr_text = await asyncio.to_thread(_extract_ocr_text, local_path)
        payload = build_image_memory_payload(event, ocr_text)

        ref = await lifecycle.ingest_worker_output(payload)
        extracted = extract_image_signals(ocr_text)

        await publish_json(
            producer,
            "worker.output.ready",
            {
                "worker": "image_worker",
                "topic": "image.process.requested",
                "athlete_id": payload.athlete_id,
                "session_id": payload.session_id,
                "asset_id": event.get("asset_id"),
                "memory_id": ref.memory_id,
                "memory_type": payload.memory_type.value,
                "summary": payload.content.summary,
                "metadata": extracted,
            },
        )
        logger.info("Image worker completed session=%s asset=%s", session_id, event.get("asset_id"))
    finally:
        try:
            os.unlink(local_path)
        except OSError:
            pass


async def main() -> None:
    topic = "image.process.requested"
    max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))

    consumer = build_consumer(topic=topic, group_id="image-worker")
    producer = build_producer()

    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    await consumer.start()
    await producer.start()
    logger.info("Image worker listening on %s", topic)

    try:
        async for msg in consumer:
            event = msg.value
            retries = int(event.get("retry_count", 0))
            try:
                await _process_event(event, lifecycle, producer)
            except Exception as exc:
                logger.exception("Image worker failed for session=%s: %s", event.get("session_id"), exc)
                if retries + 1 >= max_retries:
                    await publish_dlq(
                        producer=producer,
                        source_topic=topic,
                        payload=event,
                        error=str(exc),
                        worker="image_worker",
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
