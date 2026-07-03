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

uvicorn backend.app.main:app --reload --port 8000
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000/dashboard**

### 6. Demo Flow (Hackathon)

1. Go to **Dashboard** → click **Seed Demo Memories**
2. Watch **Live Memory Stream** animate `remember()` → `improve()` → graph updates
3. Go to **Coach Chat** → ask "How has Rahul improved?"
4. See `recall()` sources cited in the answer

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

**No mocked memory.** If `LLM_API_KEY` is missing, Cognee operations will fail — by design.

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| coach@nextplay.ai | demo | Coach |
| rahul@nextplay.ai | demo | Athlete |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/memory/seed-demo` | Seed cricket demo memories |
| POST | `/api/v1/memory/recall` | Cognee recall |
| GET | `/api/v1/memory/stream` | SSE live memory panel |
| POST | `/api/v1/sessions` | Create session |
| POST | `/api/v1/sessions/{id}/assets` | Upload → MinIO → Kafka |

## Docs

- [Implementation Plan](docs/implementation-plan.md)
- [Project Status](docs/project-status.md)
- [Kafka Topics](docs/kafka-topics.md)
- [Architecture](docs/architecture.md)
