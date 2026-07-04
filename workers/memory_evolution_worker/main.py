"""Memory evolution worker — worker.output.ready -> improve()/forget() -> memory.lifecycle."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime

from memory.cognee_client import CogneeMemoryClient
from memory.lifecycle import MemoryLifecycleService
from memory.schemas import ForgetPolicy
from workers.shared.kafka_utils import build_consumer, build_producer, publish_json
from workers.shared.logger import configure_logger

logger = configure_logger(__name__)


async def main() -> None:
    topic = "worker.output.ready"
    consumer = build_consumer(topic=topic, group_id="memory-evolution-worker")
    producer = build_producer()

    client = CogneeMemoryClient(dataset=os.getenv("COGNEE_DATASET", "nextplay_ai"))
    lifecycle = MemoryLifecycleService(client)

    await consumer.start()
    await producer.start()
    logger.info("Memory evolution worker listening on %s", topic)

    try:
        async for msg in consumer:
            event = msg.value
            athlete_id = event.get("athlete_id")
            session_id = event.get("session_id")
            if not athlete_id:
                logger.warning("Skipping evolution event without athlete_id: %s", event)
                continue

            try:
                await lifecycle.run_evolution_cycle(athlete_id=athlete_id)
                await publish_json(
                    producer,
                    "memory.lifecycle",
                    {
                        "op": "improve",
                        "message": "Merged and enriched athlete memories",
                        "athlete_id": athlete_id,
                        "session_id": session_id,
                        "at": datetime.utcnow().isoformat(),
                    },
                )
                await client.forget(ForgetPolicy(athlete_id=athlete_id, older_than_days=365))
                await publish_json(
                    producer,
                    "memory.lifecycle",
                    {
                        "op": "forget",
                        "message": "Archived obsolete memories",
                        "athlete_id": athlete_id,
                        "session_id": session_id,
                        "at": datetime.utcnow().isoformat(),
                    },
                )
                logger.info("Evolution cycle completed for athlete=%s session=%s", athlete_id, session_id)
            except Exception as exc:
                logger.exception("Evolution cycle failed for athlete=%s: %s", athlete_id, exc)
    finally:
        await consumer.stop()
        await producer.stop()


if __name__ == "__main__":
    asyncio.run(main())
