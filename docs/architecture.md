# Architecture

## Core Principle

**Cognee IS the brain.** Workers extract facts. Cognee owns memory. LLM owns language.

## Data Flow

```
Upload → MinIO → Kafka → Worker → remember() → Cognee Graph
                                              ↓
Coach Chat ← LLM ← recall() ←─────────────────┘
```

## Layer Responsibilities

| Layer | Stores Intelligence? |
|-------|---------------------|
| PostgreSQL | No — operational metadata only |
| MinIO | No — raw files only |
| Cognee | **Yes** — all athlete intelligence |
| Qwen LLM | No — generates language from recall context |

## Removal Test

Disable Cognee → coach chat, timeline, recommendations, and reports must fail.
