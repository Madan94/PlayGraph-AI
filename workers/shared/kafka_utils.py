from __future__ import annotations

import json
import os
from typing import Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer


def build_consumer(topic: str, group_id: str) -> AIOKafkaConsumer:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=servers,
        group_id=group_id,
        value_deserializer=lambda m: json.loads(m.decode()),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
    )


def build_producer() -> AIOKafkaProducer:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    return AIOKafkaProducer(
        bootstrap_servers=servers,
        value_serializer=lambda v: json.dumps(v, default=str).encode(),
    )


async def publish_json(producer: AIOKafkaProducer, topic: str, payload: dict[str, Any]) -> None:
    key = payload.get("athlete_id") or payload.get("job_id") or payload.get("session_id")
    await producer.send_and_wait(topic, value=payload, key=str(key).encode() if key else None)


async def publish_dlq(
    producer: AIOKafkaProducer,
    source_topic: str,
    payload: dict[str, Any],
    error: str,
    worker: str,
    retry_count: int,
) -> None:
    dlq_topic = f"{source_topic}.dlq"
    event = {
        "worker": worker,
        "source_topic": source_topic,
        "retry_count": retry_count,
        "error": error,
        "payload": payload,
    }
    await publish_json(producer, dlq_topic, event)
