from __future__ import annotations

import json
import logging

from aiokafka import AIOKafkaProducer

from backend.app.core.config import settings

logger = logging.getLogger(__name__)
_producer: AIOKafkaProducer | None = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        await _producer.start()
    return _producer


async def publish_event(topic: str, payload: dict) -> None:
    producer = await get_producer()
    await producer.send_and_wait(topic, payload)
    logger.info("Published to %s: %s", topic, payload.get("session_id"))


async def close_producer() -> None:
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None
