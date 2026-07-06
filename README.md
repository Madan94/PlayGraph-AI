# PlayGraphAI

**Memory-first athlete intelligence platform** — ingest training sessions, build long-term performance memory with Cognee, and give coaches grounded AI chat, timelines, and reports.

> Empowering young athletes through technology, structured assessment, and persistent coaching memory.

![PlayGraphAI Platform Overview](./docs/images/placeholder-platform-overview.png)


---

## Table of Contents

1. [Vision](#vision)
2. [What We Are Building](#what-we-are-building)
3. [Why Cognee Is the Brain](#why-cognee-is-the-brain)
4. [System Architecture](#system-architecture)
5. [End-to-End Data Flow](#end-to-end-data-flow)
6. [Tech Stack](#tech-stack)
7. [Repository Structure](#repository-structure)
8. [Prerequisites](#prerequisites)
9. [Environment Configuration](#environment-configuration)
10. [Local Development Setup](#local-development-setup)
11. [Docker Deployment](#docker-deployment)
12. [Workers Pipeline](#workers-pipeline)
13. [Authentication & Roles](#authentication--roles)
14. [Coach & Athlete Portals](#coach--athlete-portals)
15. [Upload & Ingestion](#upload--ingestion)
16. [Memory Lifecycle](#memory-lifecycle)
17. [API Reference](#api-reference)
18. [Database Schema](#database-schema)
19. [Health & Observability](#health--observability)
20. [Production Checklist](#production-checklist)
21. [Troubleshooting](#troubleshooting)
22. [Roadmap](#roadmap)
23. [License & Contributing](#license--contributing)

---

## Vision

Traditional sports tech stores files in drives and spreadsheets. Coaches lose context across seasons. Athletes cannot see their own progress holistically. PlayGraphAI treats **memory as the product**:

- Every upload becomes structured, searchable, long-term athlete intelligence.
- Coaches query history in natural language — answers are grounded in recalled memory, not hallucination.
- Athletes participate via their own portal and (coming soon) a **mobile app for efficient on-field assessment**.

**Core principle:** All intelligence flows through Cognee's `remember()`, `recall()`, `improve()`, and `forget()`. PostgreSQL holds operational metadata only. MinIO holds raw files only. **Cognee holds the brain.**

---

## What We Are Building

### Web Platform (Current)

| Surface | Users | Capabilities |
|---------|-------|--------------|
| **Marketing site** | Public | Problem, features, workflow, FAQ, CTA |
| **Coach portal** | Coaches | Dashboard, roster, multi-format upload, coach chat, memory stream, timeline, invites, workflow viz, PDF reports |
| **Athlete portal** | Athletes | Dashboard, upload, timeline, settings, coach linking via invite |

![Coach Dashboard](./docs/images/placeholder-coach-dashboard.png)


### Mobile App (In Development)

We are building a **React Native mobile application** for efficient athlete assessment in real training environments:

| Feature | Purpose |
|---------|---------|
| **On-field video capture** | Record sessions courtside without a laptop |
| **Quick session notes** | Voice-to-text and structured note entry |
| **Athlete self-upload** | Push media to the same ingestion pipeline as web |
| **Timeline & progress** | View recalled memories on mobile |
| **Offline-first queue** | Queue uploads when connectivity is poor; sync when online |

![Mobile App Mockup](./docs/images/placeholder-mobile-app.png)


The mobile app shares the same backend API, auth (OTP), and Cognee memory graph as the web app — one athlete, one memory dataset, multiple surfaces.

---

## Why Cognee Is the Brain

PlayGraphAI is intentionally built **memory-first**, not chat-first. [Cognee](https://docs.cognee.ai/) is the intelligence layer that makes this possible.

### What Cognee Does for Us

| Capability | PlayGraphAI usage |
|------------|-------------------|
| **`remember()`** | Workers and backend ingest structured session summaries into per-athlete datasets |
| **`recall()`** | Coach chat, training timeline, and PDF reports retrieve grounded context |
| **`improve()`** | Periodic memory enrichment and deduplication (on demand / evolution cycles) |
| **`forget()`** | Dataset-scoped archival of stale memories |
| **Knowledge graph** | Entities (athlete, session, metrics, injuries) and relationships extracted automatically |
| **Per-athlete isolation** | Dataset pattern: `{COGNEE_DATASET}_{athlete_id}` |

![Cognee Memory Graph](./docs/images/placeholder-cognee-graph.png)

### Cognee Cloud vs Embedded

| Mode | When to use | Configuration |
|------|-------------|---------------|
| **Cloud** (recommended) | Production, hackathon demo, no local graph DB | `COGNEE_MODE=cloud`, `COGNEE_BASE_URL`, `COGNEE_API_KEY` |
| **Embedded** | Local dev without cloud tenant | `COGNEE_MODE=embedded`, local `DATA_ROOT_DIRECTORY` / `SYSTEM_ROOT_DIRECTORY` |

```env
COGNEE_MODE=cloud
COGNEE_BASE_URL=https://your-tenant.aws.cognee.ai
COGNEE_API_KEY=your_cognee_cloud_api_key
COGNEE_DATASET=playgraph-ai
```

### Removal Test

If you disable Cognee:

- Coach chat returns no grounded context
- Training timeline is empty
- PDF reports have no memory content
- Live memory stream stops emitting lifecycle events

**The platform is designed to fail honestly** — we do not mock memory.

### How Cognee Changed Our Architecture

**Before memory-first thinking:** CRUD app with files in S3 and chat bolted on.

**After Cognee:** Event-driven ingestion → workers extract → single `remember()` path → all consumer features are recall-driven.

```
Workers extract facts  →  Cognee owns memory  →  LLM owns language only
```

---

## System Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    Web[Next.js Web App]
    Mobile[React Native App - In Dev]
  end

  subgraph bff [BFF Layer]
    NextAPI[Next.js API Routes /api/auth /api/v1]
  end

  subgraph api [Backend - FastAPI :8002]
    Auth[OTP Auth + JWT]
    Sessions[Sessions + Upload]
    MemoryAPI[Memory Ingest + SSE]
    Chat[Coach Chat]
    Reports[PDF Reports]
  end

  subgraph infra [Infrastructure]
    PG[(PostgreSQL)]
    MinIO[(MinIO)]
    Kafka[Redpanda / Kafka]
  end

  subgraph workers [Workers - Docker]
    VideoW[video-worker]
    ImageW[image-worker]
    AudioW[audio-worker]
    JsonW[json-worker]
  end

  subgraph brain [Intelligence Layer]
  Cognee[Cognee Cloud / SDK]
  end

  subgraph llm [LLM Providers]
    Vision[Vision API - OpenRouter]
    Audio[Whisper API]
    CoachLLM[Coach Chat LLM]
  end

  Web --> NextAPI
  Mobile -.-> api
  NextAPI --> api
  api --> PG
  api --> MinIO
  api --> Kafka
  api --> Cognee
  api --> CoachLLM
  Kafka --> VideoW
  Kafka --> ImageW
  Kafka --> AudioW
  Kafka --> JsonW
  VideoW --> MinIO
  ImageW --> MinIO
  AudioW --> MinIO
  JsonW --> MinIO
  VideoW --> Vision
  ImageW --> Vision
  AudioW --> Audio
  VideoW --> MemoryAPI
  ImageW --> MemoryAPI
  AudioW --> MemoryAPI
  JsonW --> MemoryAPI
  MemoryAPI --> Cognee
  Chat --> Cognee
```

![Architecture Diagram](./docs/images/placeholder-architecture.png)


### Layer Responsibilities

| Layer | Stores intelligence? | Responsibility |
|-------|---------------------|----------------|
| **Next.js frontend** | No | Coach/athlete UI, BFF proxy, OTP email delivery |
| **FastAPI backend** | No | Auth, sessions, upload orchestration, memory ingest API, chat orchestration |
| **PostgreSQL** | No | Users, athletes, sessions, jobs, ops log |
| **MinIO** | No | Raw video, images, audio, JSON files |
| **Kafka** | No | Async job dispatch to workers |
| **Workers** | No | Extract, transcribe, analyze — POST to backend ingest |
| **Cognee** | **Yes** | All athlete memory, graph, embeddings, recall |
| **LLM APIs** | No | Language generation and vision/audio analysis only |

---

## End-to-End Data Flow

### 1. Upload → Memory

```
Coach/Athlete uploads file
    → POST /api/v1/sessions (create session)
    → POST /api/v1/sessions/{id}/assets (multipart → MinIO)
    → Kafka topic: {video|image|audio|json}.process.requested
    → Worker downloads from MinIO, analyzes/transcribes
    → POST /api/v1/memory/ingest (MemoryPayload)
    → Cognee remember() on dataset playgraph-ai_{athlete_id}
    → SSE: remember + graph_updated events
```

![Upload Flow](./docs/images/placeholder-upload-flow.png)

### 2. Manual Notes (No Worker)

```
Coach/Athlete submits note text
    → POST /api/v1/sessions/{id}/notes
    → Backend builds MemoryPayload
    → Cognee remember() directly (async background task)
```

### 3. Coach Chat

```
Coach asks question + selects athlete
    → POST /api/v1/chat
    → Cognee recall() for athlete dataset
    → LLM generates answer from recalled sources only
    → Response includes citations + memories_used count
```

![Coach Chat](./docs/images/placeholder-coach-chat.png)

### 4. Training Timeline

```
GET /api/v1/chat/timeline/{athlete_id}
    → Cognee recall() with timeline-oriented query
    → Returns list of memory summaries (empty dataset = empty list, not error)
```

### 5. PDF Report

```
POST /api/v1/reports/generate
    → recall() memories for athlete
    → ReportLab PDF generation
    → Download to coach
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| **BFF** | Next.js API routes, Jose JWT, Nodemailer (OTP) |
| **Backend** | FastAPI, Python 3.12, SQLAlchemy async, Pydantic v2 |
| **Memory** | Cognee 1.x SDK / Cognee Cloud |
| **Database** | PostgreSQL 16 |
| **Object storage** | MinIO (S3-compatible) |
| **Messaging** | Redpanda (Kafka-compatible) |
| **Workers** | Python, aiokafka, OpenCV, httpx |
| **Vision / Audio** | OpenRouter (GPT-4o, Whisper) |
| **Coach LLM** | OpenAI-compatible API (OpenRouter) |
| **Mobile (planned)** | React Native, Vision Camera, WebRTC |
| **Containers** | Docker, Docker Compose |

---

## Repository Structure

```
PlayGraph-AI/
├── frontend/                 # Next.js 15 web app
│   ├── app/
│   │   ├── (marketing)/      # Landing page
│   │   ├── coach/            # Coach portal
│   │   ├── athlete/          # Athlete portal
│   │   ├── auth/             # OTP login/signup
│   │   └── api/              # BFF: auth, v1 proxy
│   ├── components/           # UI, upload hub, memory panels
│   └── lib/                  # API client, auth, hooks
│
├── backend/                  # FastAPI application
│   └── app/
│       ├── api/v1/           # REST endpoints
│       ├── application/      # Chat service
│       ├── core/             # Config, security, access control
│       └── infrastructure/   # DB, MinIO, Kafka, LLM
│
├── memory/                   # Cognee adapter (THE BRAIN)
│   ├── cognee_client.py      # remember/recall/improve/forget
│   ├── cognee_connection.py  # Cloud vs embedded bootstrap
│   ├── lifecycle.py          # Orchestration
│   ├── ingest_client.py      # Worker → backend HTTP client
│   └── schemas.py            # MemoryPayload, RecallQuery, etc.
│
├── workers/                  # Kafka consumers
│   ├── video_worker/         # OpenCV + vision LLM
│   ├── image_worker/         # Still image analysis
│   ├── audio_worker/         # Whisper + summary
│   ├── json_worker/          # Wearable JSON parsing
│   └── shared/               # minio_utils, vision_llm, audio_llm
│
├── docker/
│   ├── docker-compose.yml           # Full stack
│   ├── docker-compose.workers.yml   # Infra + workers (hybrid dev)
│   ├── Dockerfile.backend
│   ├── Dockerfile.worker
│   ├── init.sql                     # Base schema
│   └── migrations/                  # OTP auth migration
│
├── docs/                     # Architecture docs
├── scripts/                  # Cognee UI, env loaders
├── .env.example              # Backend + Cognee + workers
└── README.md                 # This file
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker Desktop** | Latest | Postgres, MinIO, Redpanda, workers |
| **Node.js** | 18+ | Frontend |
| **Python** | 3.12+ | Backend, workers (local dev) |
| **Git** | — | Clone repo |

### External Services (Production)

| Service | Required | Purpose |
|---------|----------|---------|
| **Cognee Cloud** | Yes (cloud mode) | Memory graph |
| **OpenRouter / OpenAI** | Yes | Vision, audio, coach chat |
| **SMTP (Gmail etc.)** | Yes | OTP email delivery |
| **Domain + TLS** | Production | HTTPS cookies |

---

## Environment Configuration

### Root `.env` (backend + workers)

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://nextplay:nextplay@localhost:5432/nextplay` |
| `JWT_SECRET` | Long random secret — **must match frontend** |
| `AUTH_INTERNAL_SERVICE_KEY` | BFF → backend internal auth — **must match frontend** |
| `COGNEE_MODE` | `cloud` or `embedded` |
| `COGNEE_BASE_URL` | Cognee Cloud tenant URL |
| `COGNEE_API_KEY` | Cognee Cloud API key |
| `COGNEE_DATASET` | Base dataset name (per-athlete: `{name}_{athlete_id}`) |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` (host) or `redpanda:29092` (Docker) |
| `MINIO_*` | Object storage credentials |
| `VISION_API_*` | Video/image analysis |
| `AUDIO_API_*` | Audio transcription |
| `QWEN_API_*` | Coach chat LLM |
| `PLAYGRAPH_API_URL` | Workers → backend ingest URL |

### `frontend/.env.local`

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Must match |
|----------|------------|
| `JWT_SECRET` | Root `.env` `JWT_SECRET` |
| `AUTH_INTERNAL_SERVICE_KEY` | Root `.env` |
| `BACKEND_URL` | `http://localhost:8002` |
| `SMTP_*` | Your mail provider for OTP |

> **Critical:** Mismatched `JWT_SECRET` causes login redirect loops. Mismatched `AUTH_INTERNAL_SERVICE_KEY` causes OTP send failures.

---

## Local Development Setup

### Step 1 — Start infrastructure

```bash
cd docker
docker compose -f docker-compose.workers.yml up -d postgres minio redpanda
```

![Infrastructure](./docs/images/placeholder-docker-infra.png)

Verify:

- Postgres: `localhost:5432`
- MinIO console: `http://localhost:9001` (minioadmin / minioadmin)
- Kafka: `localhost:9092`

### Step 2 — Run database migration (existing DBs only)

If your database was created before OTP auth:

```bash
docker exec -i docker-postgres-1 psql -U nextplay -d nextplay < docker/migrations/002_auth_otp.sql
```

### Step 3 — Backend

```bash
pip install -r backend/requirements.txt
pip install -r memory/requirements.txt

# Windows PowerShell
$env:PYTHONPATH="."
python -m uvicorn backend.app.main:app --reload --port 8002

# macOS / Linux
export PYTHONPATH=.
python -m uvicorn backend.app.main:app --reload --port 8002
```

Verify: `GET http://localhost:8002/api/v1/health` → `"cognee": { "mode": "cloud", ... }`

### Step 4 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3002**

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/auth/coach` | Coach OTP login |
| `/auth/athlete` | Athlete OTP login |
| `/coach/dashboard` | Coach home |
| `/athlete/dashboard` | Athlete home |

### Step 5 — Workers (Docker recommended)

```powershell
cd docker
.\up-workers.ps1
```

Or:

```bash
docker compose -f docker-compose.workers.yml up -d --build \
  json-worker video-worker image-worker audio-worker
```

> Stop any local `python -m workers.main` processes first — only one Kafka consumer group per worker type.

Worker logs:

```bash
docker compose -f docker-compose.workers.yml logs -f video-worker
```

---

## Docker Deployment

### Option A — Hybrid (recommended for development)

| Component | Where it runs |
|-----------|---------------|
| Postgres, MinIO, Kafka | Docker |
| Workers | Docker |
| Backend | Host `:8002` |
| Frontend | Host `:3002` |

```bash
cd docker
docker compose -f docker-compose.workers.yml up -d --build
```

Workers use `PLAYGRAPH_API_URL=http://host.docker.internal:8002`.

### Option B — Full stack

```bash
cd docker
docker compose up -d --build
```

| Service | Port |
|---------|------|
| Backend | `8000` |
| Postgres | `5432` |
| MinIO | `9000` / `9001` |
| Kafka | `9092` |

### Port layout (local dev default)

| Service | Port | Notes |
|---------|------|-------|
| PlayGraph frontend | **3002** | `npm run dev` |
| PlayGraph backend | **8002** | Avoids Cognee CLI default `8000` |
| Cognee CLI UI | 3000 / 8000 | Separate tool, not PlayGraph |

---

## Workers Pipeline

| Worker | Kafka topic | Input | Output |
|--------|-------------|-------|--------|
| `video-worker` | `video.process.requested` | MP4, MOV, AVI, WebM | Frame analysis + session summary |
| `image-worker` | `image.process.requested` | PNG, JPG, WebP | Vision analysis summary |
| `audio-worker` | `audio.process.requested` | MP3, WAV, WebM, recordings | Whisper transcript + summary |
| `json-worker` | `json.process.requested` | Wearable JSON exports | Parsed metrics + summary |
| *(backend)* | — | Manual notes | Direct `remember()` |

Workers do **not** call Cognee directly in cloud mode. They POST to:

```
POST /api/v1/memory/ingest
Header: X-Internal-Key: {AUTH_INTERNAL_SERVICE_KEY}
```

![Worker Pipeline](./docs/images/placeholder-worker-pipeline.png)

### Start workers locally (alternative)

```powershell
$env:PYTHONPATH="."
$env:WORKER_TYPE="video"   # video | image | audio | json
python -m workers.main
```

---

## Authentication & Roles

### OTP Email Flow

```mermaid
sequenceDiagram
  participant User
  participant NextBFF as Next.js BFF
  participant SMTP
  participant FastAPI
  participant PG as PostgreSQL

  User->>NextBFF: POST /api/auth/otp/send
  NextBFF->>FastAPI: POST /api/v1/auth/otp/request (X-Internal-Key)
  FastAPI->>PG: Store hashed OTP
  FastAPI-->>NextBFF: otp_code
  NextBFF->>SMTP: Send email
  NextBFF-->>User: { sent: true }

  User->>NextBFF: POST /api/auth/otp/verify
  NextBFF->>FastAPI: POST /api/v1/auth/otp/verify
  FastAPI->>PG: Validate OTP, create/find user
  FastAPI-->>NextBFF: access_token + user
  NextBFF-->>User: Set httpOnly cookie + user JSON
```

![Auth Flow](./docs/images/placeholder-auth-flow.png)

### Roles

| Role | Access |
|------|--------|
| **coach** | Full coach portal, all linked athletes |
| **athlete** | Own profile, upload, timeline, invite redemption |

### Coach ↔ Athlete linking

1. Coach creates athlete on roster (or via upload page).
2. Coach generates invite code (`/coach/invites`).
3. Athlete signs up and redeems code (`/athlete/settings`).
4. System merges roster athlete ID with athlete user account so **both see the same Cognee memory dataset**.

---

## Coach & Athlete Portals

### Coach (`/coach/*`)

| Page | Description |
|------|-------------|
| `/coach/dashboard` | Roster, quick actions, training timeline, live memory stream |
| `/coach/upload` | Multi-tab upload hub (video, images, audio, JSON, notes) |
| `/coach/chat` | Grounded coach chat with recall citations |
| `/coach/memory` | Memory operations stats + live SSE stream |
| `/coach/workflow` | Interactive ingestion pipeline canvas |
| `/coach/invites` | Generate athlete invite codes |
| `/coach/athletes/[id]` | Athlete profile, charts, timeline, PDF report |

### Athlete (`/athlete/*`)

| Page | Description |
|------|-------------|
| `/athlete/dashboard` | Welcome, timeline preview, upload link |
| `/athlete/upload` | Self-service session upload |
| `/athlete/timeline` | Recalled training memories |
| `/athlete/settings` | Coach invite redemption |

![Athlete Portal](./docs/images/placeholder-athlete-portal.png)

---

## Upload & Ingestion

### Supported formats

| Tab | Formats | Worker |
|-----|---------|--------|
| Video | MP4, MOV, AVI, WebM | `video-worker` |
| Images | PNG, JPG, WebP (multi-file) | `image-worker` |
| Audio | MP3, WAV, M4A + mic recording | `audio-worker` |
| JSON | Wearable / GPS exports | `json-worker` |
| Notes | Plain text | Backend direct |
| Live video | Coming soon | — |
| Wearables sync | Coming soon | — |

### Session creation payload

```json
{
  "athlete_id": "uuid",
  "title": "Session — 7/5/2026",
  "type": "training",
  "sport": "Cricket",
  "description": "Optional coach notes"
}
```

---

## Memory Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Upload
  Upload --> WorkerExtract: file upload
  Upload --> DirectRemember: manual note
  WorkerExtract --> IngestAPI: MemoryPayload
  IngestAPI --> Remember: cognee.remember()
  Remember --> GraphUpdated: knowledge graph
  GraphUpdated --> Recall: coach chat / timeline
  Recall --> Improve: on demand
  Improve --> Forget: stale data policy
```

### Per-athlete dataset isolation

```
COGNEE_DATASET=playgraph-ai
Athlete UUID: abc-123
→ Cognee dataset: playgraph-ai_abc-123
```

### Live Memory Stream (SSE)

```
GET /api/v1/memory/stream
```

Events: `remember`, `recall`, `improve`, `forget`, `graph_updated`

Consumed by the **Live Memory Panel** on coach dashboard and memory page.

---

## API Reference

Base URL: `http://localhost:8002/api/v1`

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + Cognee connection status |
| GET | `/ready` | Readiness probe |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/otp/request` | Internal key | Request OTP (BFF only) |
| POST | `/auth/otp/verify` | — | Verify OTP, get JWT |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Revoke session |

### Athletes

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/athletes` | coach/athlete | List accessible athletes |
| POST | `/athletes` | coach | Create roster athlete |
| GET | `/athletes/{id}` | coach/athlete | Get athlete profile |

### Sessions & Upload

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create session |
| POST | `/sessions/{id}/assets` | Multipart upload → MinIO → Kafka |
| POST | `/sessions/{id}/notes` | Manual note → direct ingest |

### Memory & Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/memory/ingest` | Worker/internal memory ingest |
| POST | `/memory/recall` | Direct recall query |
| GET | `/memory/stats` | Operation counts |
| GET | `/memory/stream` | SSE lifecycle events |
| POST | `/chat` | Coach chat (recall + LLM) |
| GET | `/chat/timeline/{athlete_id}` | Training timeline |

### Invites & Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | `/invites` | Create coach invite |
| GET | `/invites` | List invites |
| POST | `/invites/redeem` | Athlete redeem code |
| POST | `/reports/generate` | PDF report download |

### Frontend BFF routes

| Route | Proxies to |
|-------|------------|
| `/api/auth/otp/send` | Backend OTP + SMTP |
| `/api/auth/otp/verify` | Backend verify + cookie |
| `/api/auth/me` | `/auth/me` |
| `/api/v1/*` | Backend API (with cookies) |

---

## Database Schema

PostgreSQL stores **operational metadata only** — not coaching intelligence.

| Table | Purpose |
|-------|---------|
| `users` | Email, role, full_name |
| `athletes` | Roster profiles, optional `user_id` link |
| `coach_athlete` | Coach ↔ athlete associations |
| `sessions` | Training session metadata |
| `session_assets` | MinIO keys, mime types |
| `ingestion_jobs` | Kafka job tracking |
| `memory_operations_log` | remember/recall/improve audit |
| `otp_requests` | Hashed OTP codes |
| `auth_sessions` | JWT session revocation |
| `coach_invites` | Invite codes |

Full DDL: [`docker/init.sql`](docker/init.sql) + [`docker/migrations/002_auth_otp.sql`](docker/migrations/002_auth_otp.sql)

---

## Health & Observability

```bash
curl http://localhost:8002/api/v1/health
```

Expected (cloud mode):

```json
{
  "status": "ok",
  "cognee": {
    "mode": "cloud",
    "dataset": "playgraph-ai",
    "dataset_pattern": "{COGNEE_DATASET}_{athlete_id}"
  }
}
```

### What to monitor in production

| Signal | Source |
|--------|--------|
| API latency / errors | FastAPI logs |
| Cognee ingest duration | Backend logs (`remember()` often 1–3 min) |
| Worker failures | `docker compose logs` |
| Kafka lag | Redpanda console |
| Memory SSE connectivity | Live Memory Panel "LIVE" badge |
| OTP delivery | SMTP logs / BFF |

---

## Production Checklist

- [ ] Generate strong `JWT_SECRET` and `AUTH_INTERNAL_SERVICE_KEY`
- [ ] Set `COOKIE_SECURE=true` and HTTPS in production
- [ ] Configure Cognee Cloud tenant with production API key
- [ ] Set up managed Postgres (not local Docker)
- [ ] Use S3 or managed MinIO with backups
- [ ] Run workers as Docker services with restart policies
- [ ] Configure SMTP with dedicated transactional email domain
- [ ] Set `CORS_ORIGINS` to production frontend URL
- [ ] Remove OTP code from API responses in production BFF (dev only)
- [ ] Enable database migrations in CI/CD
- [ ] Set up health check probes on `/api/v1/health` and `/api/v1/ready`
- [ ] Add image assets to `docs/images/` (replace placeholders in this README)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login redirect loop | `JWT_SECRET` mismatch | Align root `.env` and `frontend/.env.local` |
| OTP send 500 | `AUTH_INTERNAL_SERVICE_KEY` mismatch or SMTP | Check keys; verify `SMTP_*` in frontend `.env.local` |
| OTP send timeout (~30s) | Backend hung on DB/Cognee | Restart backend; verify Postgres is up |
| Upload 422 | Missing `asset_type` or `file` | Use upload UI or correct multipart form |
| Upload 10MB limit | Next.js body size | `next.config.ts` `proxyClientMaxBodySize: "500mb"` |
| Timeline empty | No memories ingested yet, or athlete ID mismatch | Run worker; athlete redeems coach invite |
| Timeline 500 (old) | Cognee empty dataset error | Fixed: returns `[]` — pull latest `memory/cognee_client.py` |
| Worker Cognee path error in Docker | Windows paths in `.env` | Workers use cloud mode; no local Cognee paths |
| Coach chat no context | No ingested memories | Upload + wait for worker + Cognee `remember()` |
| Video worker idle | Kafka not running or wrong bootstrap | `KAFKA_BOOTSTRAP_SERVERS=localhost:9092` on host |

---

## Roadmap

| Phase | Item | Status |
|-------|------|--------|
| **MVP** | Web coach + athlete portals | ✅ Done |
| **MVP** | Cognee Cloud integration | ✅ Done |
| **MVP** | Multi-format upload + workers | ✅ Done |
| **MVP** | OTP auth + invites | ✅ Done |
| **Phase 2** | React Native mobile app (efficient on-field assessment) | 🚧 In development |
| **Phase 2** | Live video streaming ingestion | Planned |
| **Phase 2** | Wearable device sync | Planned |
| **Phase 3** | Automated `improve()` / `forget()` evolution cycles | Planned |
| **Phase 3** | Multi-coach organizations | Planned |
| **Phase 3** | Scout / admin roles | Planned |

---

## License & Contributing

<!-- Add license badge and contributing guidelines when open-sourcing -->

For questions about Cognee integration, see [`docs/architecture.md`](docs/architecture.md) and [Cognee documentation](https://docs.cognee.ai/).

---

<p align="center">
  <strong>PlayGraphAI</strong> — Memory-first athlete intelligence powered by Cognee
</p>

<p align="center">
  <img src="./docs/images/placeholder-logo-banner.png" alt="PlayGraphAI Logo Banner" width="600" />
</p>
