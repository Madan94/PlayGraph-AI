# Kafka Topics

| Topic | Producer | Consumer |
|-------|----------|----------|
| `ingestion.received` | Ingestion Service | Router |
| `video.process.requested` | Router | video_worker |
| `audio.process.requested` | Router | audio_worker |
| `image.process.requested` | Router | image_worker |
| `json.process.requested` | Ingestion | json_worker |
| `worker.output.ready` | Workers | memory/evolution |
| `memory.lifecycle` | Memory Service | SSE bridge |
| `report.generate.requested` | API | report service |

Partition key: `athlete_id`
