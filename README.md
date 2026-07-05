# PlayGraph-AI (NextPlayAI)

Empowering India's Young Athletes Through Technology and Opportunity.

Memory-first AI platform for elite athlete intelligence. **Cognee is the brain** — remove it, lose all intelligence.

## Architecture

```
Frontend (Next.js 15) → Backend (FastAPI) → Memory Layer → Cognee
                                ↓
                          Kafka → Workers → remember()
```

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.12+
- OpenAI API key (for Cognee LLM/embeddings) — or configure Ollama locally

### 2. Environment

```bash
cp .env.example .env
# Edit .env — set LLM_API_KEY at minimum
```

### 3. Start Infrastructure

```bash
cd docker
docker compose up -d postgres minio redpanda
```

### 4. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
pip install -r ../memory/requirements.txt

# From repo root:
set PYTHONPATH=.   # Windows
export PYTHONPATH=.  # macOS/Linux

python -m uvicorn backend.app.main:app --reload --port 8002
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3002/dashboard**

### 7. Run workers in Docker

Workers consume Kafka, download from MinIO, and write Cognee memory. Two options:

**Option A — Full stack in Docker** (backend + workers share named Cognee volumes):

```bash
cd docker
docker compose up -d --build postgres minio redpanda backend video-worker json-worker
```

**Option B — Workers in Docker, backend on host** (hybrid dev; shared Cognee bind mounts):

```bash
cd docker
docker compose -f docker-compose.workers.yml up -d --build
```

Keep `KAFKA_BOOTSTRAP_SERVERS=localhost:9092` in `.env` for the host backend. Workers use internal `redpanda:29092` automatically.

**Logs:**

```bash
docker compose logs -f video-worker
docker compose logs -f json-worker
```

**Stop local workers** before starting Docker workers (only one consumer group per worker type).

| Service | Env in container |
|---------|------------------|
| Kafka | `redpanda:29092` |
| MinIO | `minio:9000` |
| Cognee data | `/app/.cognee_data` (volume or bind mount) |

### 8. Populate memory

1. Insert at least one athlete into Postgres (see `docker/init.sql` schema)
2. **Upload** a video or wearable JSON session for that athlete
3. Watch **Live Memory Stream** for `remember()` → `improve()` events
4. **Coach Chat** → ask about the athlete's performance
5. See `recall()` sources cited in the answer

Check where Cognee runs: `GET http://localhost:8002/api/v1/health` → `cognee` block

### Port layout (local dev)

| Service | Port | Notes |
|---------|------|--------|
| **PlayGraph frontend** | **3002** | `npm run dev` |
| **PlayGraph backend** | **8002** | `python -m uvicorn ... --port 8002` |
| Cognee CLI UI | 3000 | Separate — graph explorer |
| Cognee API | 8000 | Separate |
| Cognee MCP | 8001 | Separate |

Configure via `.env`: `BACKEND_PORT`, `FRONTEND_PORT`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`.

## Project Structure

```
├── frontend/       Next.js 15 + React Query + Framer Motion
├── backend/        FastAPI + JWT + ingestion API
├── memory/         Cognee adapter (remember/recall/improve/forget)
├── workers/        Kafka consumers → remember()
├── docker/         Compose + Postgres schema
└── docs/           Architecture & implementation plan
```

## Cognee Integration

All intelligence flows through `memory/cognee_client.py`:

- `remember()` — workers store extracted metrics
- `recall()` — coach chat, timeline, reports
- `improve()` — merge duplicate memories after ingestion
- `forget()` — archive stale data

**No mocked memory.** Cognee runs as an embedded local SDK (see `/api/v1/health`). If `LLM_API_KEY` is missing, Cognee operations will fail — by design.

## Cognee runtime

| Item | Value |
|------|--------|
| Mode | **Local embedded SDK** (`pip install cognee`) |
| Not used | Cognee Cloud, Cognee CLI as a separate service |
| Data dirs | `DATA_ROOT_DIRECTORY`, `SYSTEM_ROOT_DIRECTORY` in `.env` |
| Dataset | `COGNEE_DATASET` per athlete: `{COGNEE_DATASET}_{athlete_id}` |
| Check | `GET /api/v1/health` or `GET /api/v1/ready` |

### Per-athlete memory (after upgrade)

Each athlete gets an isolated Cognee dataset: `nextplay_ai_{athlete_uuid}`.

**One-time migration** — wipe old shared graph and re-upload sessions:

```powershell
# Stop backend + workers first
Remove-Item -Recurse -Force .cognee_data, .cognee_system

# Existing Postgres DB — add session notes column
docker exec -it docker-postgres-1 psql -U nextplay -d nextplay -c "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;"
```

### Shared Cognee storage (PlayGraph + Cognee CLI)

Both must read the **same** paths from repo-root `.env`:

```env
DATA_ROOT_DIRECTORY=D:\PlayGraph-AI\.cognee_data
SYSTEM_ROOT_DIRECTORY=D:\PlayGraph-AI\.cognee_system
```

PlayGraph backend/workers load this automatically via `memory/env_loader.py`.

**Start Cognee CLI with the same paths** (recommended):

```powershell
cd D:\PlayGraph-AI
$env:PYTHONPATH="."
python scripts/start_cognee_ui.py
```

Or load `.env` into your shell first, then run `cognee-cli -ui`:

```powershell
. .\scripts\load-env.ps1
cognee-cli -ui
```

Verify both see the same folders: `GET http://localhost:8002/api/v1/health` → `data_root_directory` matches your `.env`.

### Cognee UI (graph visualization, dev)

Run alongside PlayGraph on different ports (reads the same `.cognee_*` folders):

```powershell
cd D:\PlayGraph-AI
$env:DATA_ROOT_DIRECTORY="D:\PlayGraph-AI\.cognee_data"
$env:SYSTEM_ROOT_DIRECTORY="D:\PlayGraph-AI\.cognee_system"
python -c "import cognee; cognee.start_ui(lambda p: None, port=3001, start_backend=True, backend_port=8002, start_mcp=True, mcp_port=8003)"
```

- Cognee UI: http://localhost:3001
- Select dataset `nextplay_ai_{athlete_id}` to explore per-athlete graph

### Video analysis models

| Role | Env var | Default |
|------|---------|---------|
| Coach chat | `QWEN_MODEL` | `openai/gpt-4o` |
| Vision keyframes | `VISION_MODEL` | `openai/gpt-4o` |
| Frame synthesis | `VISION_SYNTH_MODEL` | `openai/gpt-4o-mini` |
| Cognee graph LLM | `LLM_MODEL` | `openrouter/openai/gpt-4o-mini` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/athletes` | List athletes |
| POST | `/api/v1/athletes` | Create athlete |
| POST | `/api/v1/memory/recall` | Cognee recall |
| GET | `/api/v1/memory/stream` | SSE live memory panel |
| POST | `/api/v1/sessions` | Create session |
| POST | `/api/v1/sessions/{id}/assets` | Upload → MinIO → Kafka |

## Docs

- [Implementation Plan](docs/implementation-plan.md)
- [Project Status](docs/project-status.md)
- [Kafka Topics](docs/kafka-topics.md)
- [Architecture](docs/architecture.md)
