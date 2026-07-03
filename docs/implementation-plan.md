# NextPlayAI — Implementation Plan

> **Principal Architect Document**  
> Production-quality MVP for an international AI hackathon  
> **Core thesis:** Cognee IS the brain. If Cognee is removed, the application loses all intelligence.

---

## Executive Summary

NextPlayAI wins a hackathon by making **Cognee visibly central**: every intelligent outcome traces back to `remember()`, `recall()`, `improve()`, or `forget()`. The MVP is not "analytics with AI sprinkled on top" — it is a **memory-first athlete intelligence platform** where workers produce facts, Cognee owns knowledge, and the LLM only speaks from recalled context.

**Hackathon demo thesis (60 seconds):**  
Upload a cricket session → workers extract metrics → `remember()` stores memories → knowledge graph updates → coach asks "How has Rahul improved?" → `recall()` → Qwen answers with evidence → live panel shows the full memory lifecycle animating in real time.

---

## 1. Architectural Reasoning

### 1.1 Core Design Principle: Cognee as the Brain

| Layer | Responsibility | Must NOT Do |
|-------|----------------|-------------|
| **Workers** | Extract structured signals from raw media/sensors | Answer questions, store long-term knowledge directly |
| **Cognee** | Memory lifecycle + graph + vectors | UI rendering, auth, file upload |
| **LLM (Qwen)** | Natural language from recalled context | Invent facts not in memory |
| **Frontend** | UX, uploads, visualization | Business intelligence logic |
| **Backend** | Orchestration, auth, ingestion, API contracts | Replace Cognee with Postgres queries for "smart" features |

**Removal test:** If Cognee is removed, coach chat, recommendations, reports, timeline intelligence, and comparisons must all break — not degrade gracefully to static SQL.

### 1.2 Sport Extensibility (Cricket First)

Use a **sport-agnostic memory schema** with **Cricket-specific worker plugins**:

```
SportPlugin (interface)
  ├── CricketPlugin  ← MVP
  ├── FootballPlugin ← future
  └── AthleticsPlugin ← future
```

Workers emit normalized events:

```json
{
  "sport": "cricket",
  "event_type": "batting_session",
  "metrics": { "strike_rate": 142, "boundaries": 8 },
  "entities": ["athlete:rahul", "session:match_2026_03_01"]
}
```

Cognee stores sport-agnostic memories; cricket semantics live in worker output + graph relationships.

### 1.3 Clean Architecture (Monorepo)

```
nextplay-ai/
├── frontend/          # Next.js 15
├── backend/           # FastAPI (API Gateway + services)
├── workers/           # Kafka consumers (video/audio/image/json)
├── memory/            # Cognee adapter + lifecycle orchestration
├── analytics/         # Read models fed by recall(), not raw DB
├── report/            # PDF generation via recall()
├── notifications/     # Event-driven alerts
├── docker/            # Compose, Dockerfiles
├── docs/              # Architecture, API, setup
└── README.md
```

**Dependency rule:** `frontend → backend → memory → Cognee`. Workers never call the frontend. LLM never writes to Postgres directly for intelligence.

---

## 2. MVP Scope (Hackathon-Critical vs Post-MVP)

### Phase 0 — Demo Spine (Must Ship)

| Feature | Cognee API | Demo Value |
|---------|------------|------------|
| Auth + RBAC | — | Multi-role demo |
| Upload match video | triggers pipeline | Entry point |
| Video worker → metrics | `remember()` | Visible intelligence creation |
| Live Memory Panel | all 4 APIs | **Primary hackathon wow** |
| Coach Chat (3–5 queries) | `recall()` + LLM | Proves memory-backed Q&A |
| Athlete profile + timeline | `recall()` | Career narrative |
| Memory Timeline animation | full lifecycle | Visual Cognee story |
| Dashboard KPIs | `recall()` aggregates | Executive view |

### Phase 1 — Strong MVP (If Time Permits)

- Session PDF report (`recall()` + evidence)
- Recommendations engine (`recall()` + rules/LLM)
- Knowledge graph viewer (Neo4j via Cognee/graph API)
- Live camera recording (WebRTC → same ingestion path as upload)
- Performance charts (Recharts from recalled metrics)

### Phase 2 — Post-Hackathon

- React Native app
- Full wearable integrations
- Multi-sport plugins
- Advanced CV (YOLOv11, RTMPose at scale)

---

## 3. Implementation Phases (8–10 Day Hackathon Cadence)

### Phase A — Foundation (Days 1–2)

**Goal:** Runnable stack, empty but wired.

1. Monorepo scaffold + Docker Compose
2. PostgreSQL schema + migrations
3. MinIO buckets
4. Kafka topics
5. FastAPI skeleton (auth, health, ingestion stub)
6. Cognee integration layer (`memory/` package) — **real SDK, not mock**
7. Next.js shell (auth, layout, dark theme)

**Exit criteria:** `docker compose up` → backend health OK → one manual `remember()` call succeeds → memory visible in Cognee.

### Phase B — Ingestion + Workers (Days 3–4)

**Goal:** Upload → Kafka → worker → `remember()`.

1. Ingestion service: validate, store file ref in MinIO, publish Kafka event
2. Video worker (MVP: frame sampling + cricket-relevant metrics; real extraction where feasible)
3. Audio worker (Whisper STT → coach feedback memories)
4. JSON worker (wearable/GPS/HR payloads)
5. Image worker (OCR/injury tags — simplified for MVP)

**Exit criteria:** Upload cricket match clip → worker logs → `remember()` called with structured payload → event in Live Memory Panel.

### Phase C — Cognee Memory Lifecycle (Days 4–5)

**Goal:** All four APIs working end-to-end.

1. `MemoryService` facade in `memory/`:
   - `remember(session_id, payload)`
   - `recall(query, athlete_id, filters)`
   - `improve(merge_candidates)`
   - `forget(archive_policy)`
2. Memory evolution job (Kafka consumer or cron):
   - On new event → `remember()` → dedupe check → `improve()` → stale check → `forget()`
3. Publish memory lifecycle events to Kafka topic `memory.lifecycle` for UI panel

**Exit criteria:** Every upload triggers animated lifecycle in UI; graph/vector counts update.

### Phase D — Intelligence Features (Days 5–7)

**Goal:** User-facing features that **require** Cognee.

1. Coach Chat API: `recall()` → context bundle → Qwen prompt (strict "answer only from context")
2. Athlete timeline: `recall()` by athlete + date range
3. Performance charts: `recall()` metric memories → Recharts
4. Recommendations: `recall()` + template/LLM
5. Session report: `recall()` → PDF (report service)

**Exit criteria:** Removing Cognee breaks chat and timeline; judges can see recall citations.

### Phase E — Hackathon Demo UX (Days 7–8)

**Goal:** Polish the story.

1. Workflow page (React Flow pipeline)
2. Live Memory Panel (WebSocket/SSE from `memory.lifecycle`)
3. Memory Timeline animation component
4. Knowledge graph viewer (subset of Neo4j entities)
5. Seed demo data: athlete "Rahul", 5 sessions, injuries, coach notes

**Exit criteria:** 3-minute scripted demo runs without manual backend steps.

### Phase F — Hardening (Days 8–10)

- Error handling, retries, idempotency keys on `remember()`
- RBAC enforcement on all recall scopes
- README + architecture docs + env template
- Demo video script + fallback offline mode (pre-seeded memories only if live fails)

---

## 4. Folder Structure (Detailed)

```
nextplay-ai/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   ├── (dashboard)/dashboard
│   │   ├── athletes/[id]
│   │   ├── sessions/[id]
│   │   ├── upload/
│   │   ├── chat/
│   │   ├── workflow/
│   │   ├── memory/
│   │   └── reports/
│   ├── features/
│   │   ├── auth/
│   │   ├── athletes/
│   │   ├── sessions/
│   │   ├── coach-chat/        # recall-driven
│   │   ├── memory-panel/      # lifecycle SSE
│   │   ├── timeline/
│   │   └── knowledge-graph/
│   ├── components/ui/         # shadcn
│   └── lib/api/               # typed clients (Zod-validated)
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/              # config, security, deps
│   │   ├── domain/            # entities, interfaces
│   │   ├── application/       # use cases
│   │   ├── infrastructure/    # repos, kafka, minio, cognee client
│   │   └── api/v1/            # routes
│   └── tests/
│
├── workers/
│   ├── shared/                # kafka, schemas, cognee client
│   ├── video_worker/
│   ├── audio_worker/
│   ├── image_worker/
│   └── json_worker/
│
├── memory/
│   ├── cognee_client.py       # thin wrapper over Cognee SDK
│   ├── lifecycle.py           # remember/recall/improve/forget orchestration
│   ├── schemas.py             # memory payload contracts
│   └── evolution_worker.py    # improve/forget pipeline
│
├── analytics/
│   └── recall_aggregates.py   # no direct "smart" SQL
│
├── report/
│   └── pdf_generator.py       # recall → template → PDF
│
├── notifications/
│   └── consumer.py
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfiles/
│
└── docs/
    ├── architecture.md
    ├── api-contracts.md
    ├── cognee-integration.md
    ├── kafka-topics.md
    ├── demo-script.md
    └── implementation-plan.md  # this file
```

---

## 5. Database Schema (PostgreSQL)

**Postgres = operational truth. Cognee = intelligence truth.**

### Core Tables

```sql
-- users & rbac
users (id, email, password_hash, role, created_at)
-- roles: athlete | coach | scout | admin

athletes (id, user_id, name, sport, dob, metadata jsonb)
coach_athlete (coach_id, athlete_id)

-- sessions & ingestion
sessions (id, athlete_id, type, sport, title, started_at, status)
session_assets (id, session_id, asset_type, minio_key, mime, size, created_at)
ingestion_jobs (id, session_id, status, kafka_offset, error, created_at)

-- operational audit (NOT intelligence store)
memory_operations_log (
  id, session_id, operation,  -- remember|recall|improve|forget
  cognee_ref, payload_hash, latency_ms, created_at
)

-- reports metadata only (content from recall)
reports (id, session_id, pdf_minio_key, generated_at)
```

**Do NOT store:** embeddings, coach Q&A knowledge, performance insights in Postgres as primary source — those live in Cognee.

---

## 6. Cognee Memory Model

### Memory Document Shape (Every `remember()`)

```json
{
  "memory_id": "uuid",
  "athlete_id": "uuid",
  "session_id": "uuid",
  "sport": "cricket",
  "memory_type": "performance_metric | coach_note | injury | wearable | transcript",
  "source_worker": "video_worker",
  "timestamp": "ISO8601",
  "content": {
    "summary": "Rahul scored 78 off 52 balls with SR 150",
    "metrics": { "runs": 78, "strike_rate": 150 },
    "entities": ["drill:cover_drive", "injury:none"]
  },
  "evidence": {
    "asset_id": "uuid",
    "frame_range": [1200, 1450]
  }
}
```

### Lifecycle Mapping

| Trigger | API | When |
|---------|-----|------|
| Worker output | `remember()` | Immediately after extraction |
| Coach chat / charts / reports | `recall()` | On every read feature |
| Duplicate session metrics | `improve()` | Evolution worker |
| Outdated drill tags (> N months) | `forget()` | Evolution worker |

### Integration Pattern (No Mock)

```python
# memory/cognee_client.py
class CogneeMemoryClient:
    async def remember(self, payload: MemoryPayload) -> MemoryRef: ...
    async def recall(self, query: RecallQuery) -> RecallResult: ...
    async def improve(self, candidates: list[MemoryRef]) -> ImproveResult: ...
    async def forget(self, policy: ForgetPolicy) -> ForgetResult: ...
```

All workers and API routes go through this client — never call Cognee SDK ad hoc.

---

## 7. API Contracts (REST v1)

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` → JWT

### Sessions & Upload

- `POST /api/v1/sessions` — create session
- `POST /api/v1/sessions/{id}/assets` — multipart → MinIO → Kafka
- `GET /api/v1/sessions/{id}` — metadata only

### Intelligence (Cognee-Backed)

- `POST /api/v1/chat` — `{ athlete_id, message }` → internally `recall()` + Qwen
- `GET /api/v1/athletes/{id}/timeline` — `recall()` grouped by date
- `GET /api/v1/athletes/{id}/metrics` — `recall()` → chart series
- `GET /api/v1/athletes/{id}/recommendations` — `recall()` + engine
- `POST /api/v1/sessions/{id}/report` — `recall()` → PDF

### Memory (Demo + Debug)

- `GET /api/v1/memory/stream` — SSE: lifecycle events
- `GET /api/v1/memory/stats` — counts from Cognee/graph
- `GET /api/v1/knowledge-graph/{athlete_id}` — subgraph for viewer

### Chat Response Rule

```json
{
  "answer": "...",
  "recall": {
    "query": "How has Rahul improved?",
    "memories_used": 12,
    "sources": [{ "memory_id": "...", "summary": "...", "session_id": "..." }]
  }
}
```

Judges must see **recall provenance** in every answer.

---

## 8. Kafka Topics

| Topic | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| `ingestion.received` | Ingestion | Router worker | asset metadata |
| `video.process.requested` | Router | video_worker | session_id, minio_key |
| `audio.process.requested` | Router | audio_worker | ... |
| `image.process.requested` | Router | image_worker | ... |
| `json.process.requested` | Router | json_worker | ... |
| `worker.output.ready` | workers | memory/evolution | structured metrics |
| `memory.lifecycle` | memory service | frontend SSE bridge | remember/recall/improve/forget events |
| `report.generate.requested` | API | report service | session_id |

**Partition key:** `athlete_id` (ordering per athlete).

---

## 9. Docker Compose (Services)

```yaml
services:
  postgres:
  minio:
  kafka:                    # or Redpanda for simplicity
  redis:                    # optional: SSE pub/sub
  cognee:                   # per Cognee deployment docs
  neo4j:                    # if not bundled in Cognee stack
  qdrant:                   # if not bundled
  backend:
  video-worker:
  audio-worker:
  json-worker:
  image-worker:
  memory-evolution-worker:
  frontend:
```

**Hackathon simplification:** If full Kafka cluster is heavy, use **Redpanda single node** or **Redis Streams** internally but keep topic names in code for architecture story.

---

## 10. Environment Variables

```env
# Backend
DATABASE_URL=
JWT_SECRET=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=

# Kafka
KAFKA_BOOTSTRAP_SERVERS=

# Cognee (required)
COGNEE_API_URL=
COGNEE_API_KEY=
COGNEE_DATASET=nextplay_ai

# Graph / Vector (if separate)
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
QDRANT_URL=

# LLM
QWEN_API_URL=
QWEN_API_KEY=
QWEN_MODEL=

# Frontend
NEXT_PUBLIC_API_URL=
```

---

## 11. Frontend Feature Map

| Route | Data Source | Cognee |
|-------|-------------|--------|
| `/dashboard` | recall aggregates | ✓ |
| `/athletes/[id]` | recall profile memories | ✓ |
| `/upload` | ingestion API | triggers remember |
| `/chat` | chat API | recall visible in UI |
| `/memory` | SSE lifecycle panel | all 4 APIs |
| `/workflow` | pipeline visualization | demo |
| `/sessions/[id]/report` | report API | recall |

### Live Memory Panel (Hackathon Centerpiece)

SSE events:

```json
{ "op": "remember", "delta": 6, "message": "Batting metrics stored", "at": "..." }
{ "op": "recall", "count": 8, "message": "Related sessions retrieved" }
{ "op": "improve", "message": "Merged duplicate cover drive memories" }
{ "op": "forget", "message": "Archived obsolete warmup drills" }
{ "op": "graph_updated", "nodes": 1247, "edges": 3891 }
```

Animate each operation with Framer Motion; show running totals.

---

## 12. Cricket-Specific Worker Outputs (MVP)

**Video worker** (cricket plugin):

- Ball detection (optional MVP)
- Run movement segments
- Batting stance timestamps
- Sprint speed between wickets (estimated)
- Session intensity score

**Audio worker:**

- Coach feedback transcript
- Sentiment (positive/corrective)
- Drill mentions extracted → entities for graph

**JSON worker:**

- GPS distance, peak HR, acceleration spikes
- Load metrics

All normalized → single `remember()` call per logical memory unit (not one giant blob).

---

## 13. Coach Chat — Canonical Demo Queries

| Query | Flow |
|-------|------|
| "How has Rahul improved?" | `recall()` → LLM → answer with sources |
| "What injuries affected performance?" | `recall()` |
| "Compare last five matches." | `recall()` |
| "What drills should Rahul practice?" | `recall()` → LLM |

---

## 14. Memory Timeline (Animated)

Every upload should visibly show:

```
remember()
    ↓
Knowledge Graph Updated
    ↓
recall()
    ↓
improve()
    ↓
forget()
    ↓
Graph Updated
```

This should be animated in the UI — this is the hackathon demo spine.

---

## 15. Security & RBAC

| Role | Can Recall | Can Remember | Scope |
|------|------------|--------------|-------|
| Athlete | Own data | Own uploads | self |
| Coach | Assigned athletes | assigned | coach_athlete |
| Scout | Read-only broader | — | org |
| Admin | All | All | global |

Enforce at API gateway **before** `recall()` — pass scoped filters into Cognee queries.

---

## 16. Testing Strategy

1. **Contract tests:** API request/response vs OpenAPI
2. **Memory integration tests:** real Cognee in CI (or test container)
3. **Lifecycle test:** upload fixture → assert remember → recall returns it → improve merges duplicate → forget archives
4. **Chat grounding test:** answer must cite memory IDs present in recall result
5. **Demo regression:** scripted E2E for 3-minute judge path

---

## 17. Documentation Deliverables

| Doc | Contents |
|-----|----------|
| `README.md` | Quick start, demo credentials, 3-min script |
| `docs/architecture.md` | Diagrams, Cognee-as-brain rationale |
| `docs/cognee-integration.md` | API usage, memory schema, lifecycle |
| `docs/api-contracts.md` | OpenAPI export |
| `docs/kafka-topics.md` | Topic catalog |
| `docs/demo-script.md` | Judge walkthrough |
| `docs/implementation-plan.md` | This document |

---

## 18. Risk Register & Mitigations

| Risk | Mitigation |
|------|------------|
| Cognee setup complexity | Phase A day-1 spike; pin version; dockerize early |
| Video CV too slow | Pre-process demo clip; worker emits real + cached metrics |
| Kafka ops overhead | Redpanda single node |
| LLM hallucination | Strict prompt: "If not in recall context, say unknown"; show sources |
| Hackathon time | Phase 0 only first; Phase 1 if ahead |

---

## 19. Recommended Build Order (Incremental)

```
1. Docker + Postgres + MinIO + Cognee connected
2. memory/ package with remember() + recall() proven
3. Upload API + MinIO + Kafka publish
4. JSON worker → remember() (fastest path to demo)
5. Live Memory Panel (SSE)
6. Coach chat with recall + Qwen
7. Video worker (cricket) → remember()
8. Athlete timeline + charts (recall)
9. Memory lifecycle animation (improve/forget)
10. PDF report
11. Workflow visualization + polish
12. Seed data + demo script
```

---

## 20. Definition of Done (MVP)

- [ ] Cognee runs in Docker; no mocked memory calls in codebase
- [ ] Upload triggers worker → `remember()` → visible in Live Memory Panel
- [ ] Coach chat answers 4 canonical questions via `recall()` with source citations
- [ ] Timeline and charts break if Cognee is down
- [ ] `improve()` and `forget()` run automatically and appear in UI
- [ ] Cricket session demo completes in < 3 minutes
- [ ] Architecture docs explain why Cognee is the brain

---

## 21. Tech Stack Reference

### Frontend

- Next.js 15, React 19, TypeScript
- Tailwind CSS, shadcn/ui, Framer Motion
- React Query, React Hook Form, Zod, Recharts

### Mobile (Post-MVP)

- React Native, Vision Camera, WebRTC

### Backend

- FastAPI, Python, JWT, RBAC

### Storage

- PostgreSQL, MinIO

### Messaging

- Apache Kafka

### Memory Layer

- Cognee, Neo4j, Qdrant

### LLM

- Qwen

### Infrastructure

- Docker

---

## Next Step

**Increment 1:** Monorepo + Docker Compose + Cognee `remember()`/`recall()` proof + empty Next.js shell + Live Memory Panel wired to SSE.

Say **"start increment 1"** to begin scaffolding with real Cognee integration — no placeholders, no mocks.
