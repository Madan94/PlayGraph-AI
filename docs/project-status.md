# NextPlayAI — Project Status

> Last updated: July 3, 2026

## Project Vision

**NextPlayAI** is a memory-first AI athlete intelligence platform where **Cognee is the brain**. Workers extract data; Cognee owns memory; the LLM only speaks from recalled context.

**Core principle:** All intelligence must flow through `remember()`, `recall()`, `improve()`, `forget()`. No mocked Cognee.

---

## Documentation

| File | Purpose |
|------|---------|
| `docs/implementation-plan.md` | Full hackathon architecture plan |
| `docs/architecture.md` | Cognee-as-brain data flow |
| `docs/kafka-topics.md` | Kafka topic catalog |
| `docs/project-status.md` | This file — what's built so far |
| `README.md` | Setup guide + demo flow |

---

## Monorepo Structure

```
PlayGraph-AI/
├── frontend/          Next.js 15 dashboard app
├── backend/           FastAPI API gateway
├── memory/            Real Cognee SDK adapter
├── workers/           Kafka consumers (json + video)
├── docker/            Compose, init.sql, Dockerfiles
├── analytics/         Placeholder
├── report/            Placeholder (PDF logic in backend API)
├── notifications/     Placeholder
└── docs/
```

---

## Increment 1 — Foundation (Completed)

### Infrastructure (`docker/`)

- **PostgreSQL** — users, athletes, sessions, assets, memory ops log, reports
- **MinIO** — file storage
- **Redpanda** — Kafka-compatible messaging
- **Demo seed data** — Coach Marcus Chen, Athlete Rahul Sharma (cricket)

### Memory Layer (`memory/`) — Real Cognee, No Mocks

- `cognee_client.py` — `remember()`, `recall()`, `improve()`, `forget()`
- `lifecycle.py` — orchestrates ingest → remember → improve
- `schemas.py` — typed memory payloads
- Lifecycle events published to SSE stream

### Backend (`backend/`)

- Auth stub (JWT, demo login)
- Session creation + file upload → MinIO → Kafka
- Memory API (remember, recall, seed-demo, stats)
- **SSE stream** — `/api/v1/memory/stream` for Live Memory Panel
- JSON worker wired to Kafka

### Frontend (`frontend/`)

- Dashboard with **Seed Demo Memories**
- **Live Memory Panel** (real-time SSE)
- **Memory Timeline** animation
- Upload page
- Basic coach chat (recall only)
- Dark glass UI, sidebar nav

---

## Increment 2 — Intelligence Features (Completed)

### Video Worker

- `workers/shared/cricket_plugin.py` — cricket metrics (strike rate, sprint, cover drive, etc.)
- `workers/video_worker/main.py` — consumes `video.process.requested`, OpenCV analysis → `remember()`
- Docker `video-worker` service

### Qwen LLM Coach Chat

- `backend/app/infrastructure/llm.py` — OpenAI-compatible Qwen client
- `POST /api/v1/chat` — **recall() → Qwen → grounded answer** with source citations
- Fallback to recall context if Qwen isn't configured
- Chat UI shows recall → LLM pipeline + evidence

### PDF Reports

- `POST /api/v1/reports/generate` — recall memories → ReportLab PDF → MinIO download
- Athlete profile: **Download Report** button

### React Flow Workflow

- `/workflow` — interactive pipeline canvas:
  Input → Streaming → Gateway → Ingestion → Kafka → Workers → **Cognee Brain** → Consumers → Outputs
- Animated edges, minimap, drag/zoom
- Live Memory Panel on the side

### Athlete Profile & Charts

- `/athletes/[id]` — Rahul Sharma profile
- **Recharts** — strike rate trend, sprint/intensity bars
- **Timeline** from `GET /api/v1/chat/timeline/{athlete_id}` (recall-driven)

---

## Frontend Routes

| Route | Feature |
|-------|---------|
| `/dashboard` | Seed demo, live memory stream |
| `/memory` | Lifecycle timeline + live stream |
| `/upload` | Video/JSON upload → pipeline |
| `/chat` | Coach Q&A (recall + Qwen) |
| `/workflow` | React Flow pipeline |
| `/athletes/[id]` | Profile, charts, PDF report |

---

## API Endpoints

| Method | Path | Cognee |
|--------|------|--------|
| GET | `/api/v1/health` | — |
| POST | `/api/v1/auth/login` | — |
| POST | `/api/v1/memory/seed-demo` | remember + improve |
| POST | `/api/v1/memory/recall` | recall |
| GET | `/api/v1/memory/stream` | SSE lifecycle |
| POST | `/api/v1/chat` | recall + LLM |
| GET | `/api/v1/chat/timeline/{id}` | recall |
| POST | `/api/v1/reports/generate` | recall → PDF |
| POST | `/api/v1/sessions` | creates session |
| POST | `/api/v1/sessions/{id}/assets` | upload → Kafka |

---

## Workers

| Worker | Topic | Output |
|--------|-------|--------|
| JSON worker | `json.process.requested` | Wearable/GPS/HR → remember() |
| Video worker | `video.process.requested` | Cricket video metrics → remember() |

---

## Demo Flow

1. Dashboard → **Seed Demo Memories**
2. Watch Live Memory Stream (`remember()`, `improve()`, graph updates)
3. Workflow page → full pipeline visualization
4. Upload video → triggers video worker → cricket metrics → `remember()`
5. Coach Chat → "How has Rahul improved?" → recall + Qwen
6. Athlete Profile → charts, timeline, PDF report

**Demo athlete ID:** `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (Rahul Sharma)  
**Demo login:** `coach@nextplay.ai` / `demo`

---

## Environment (`.env.example`)

- `LLM_API_KEY` — required for Cognee (OpenAI default)
- `QWEN_API_URL`, `QWEN_API_KEY`, `QWEN_MODEL` — optional for LLM chat
- Postgres, MinIO, Kafka, Cognee dataset paths

---

## How to Run

```bash
# Copy env
cp .env.example .env   # set LLM_API_KEY + optional QWEN_API_KEY

# Infrastructure
cd docker && docker compose up -d postgres minio redpanda

# Backend (from repo root)
pip install -r backend/requirements.txt
set PYTHONPATH=.
uvicorn backend.app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000/dashboard`

---

## Build Status

- **Frontend build:** passes (`npm run build` in `frontend/`)
- **Backend:** requires `LLM_API_KEY` for Cognee; Qwen optional for chat

---

## Not Yet Done (Increment 3+)

- Audio worker (Whisper STT → remember)
- Image worker (OCR, injury detection)
- Knowledge graph viewer (Neo4j)
- Full JWT/RBAC enforcement
- React Native mobile app
- Live camera / WebRTC recording
- Recommendations engine
- Landing/marketing page (earlier version was removed when user asked to delete all except README)

---

## Key Design Decisions

- Postgres = operational metadata only; **intelligence lives in Cognee**
- All workers call `memory/` package, never Cognee SDK directly elsewhere
- Chat must show recall provenance (sources cited)
- Cricket-first via sport plugin pattern for future multi-sport
- Redpanda used instead of full Kafka for hackathon simplicity
