# PlayGraph-AI — Cognee Ingest Problem Context

This document captures the memory-ingest failure investigated on **2026-07-05**: backend appearing to stop after the TikToken tokenizer line during video worker ingest on Windows.

---

## Symptom

During video upload → worker analysis → `POST /api/v1/memory/ingest`:

1. Backend returns **202 Accepted** immediately (expected).
2. Logs show `Background ingest started` and `Cognee remember() starting`.
3. Cognee runs migrations, connection tests, embedding engine init.
4. Last visible line is often:

   ```
   Switching to TikToken default tokenizer. [OpenAICompatibleEmbeddingEngine]
   ```

5. No further logs for minutes — or the shell prompt returns (`PS D:\PlayGraph-AI>`) with **no** `Background ingest completed` line.

Worker logs show `Memory ingest accepted by backend` then go idle. **This is correct** — ingest continues on the backend, not in the worker.

---

## Architecture (current)

```
Video worker: download → vision analysis → POST /api/v1/memory/ingest (202)
Backend background task: lifecycle.ingest_worker_output() → cognee.remember(self_improvement=False)
Coach chat / timeline: cognee.recall() on same backend process (serialized via asyncio lock)
```

Workers **must not** call Cognee directly on Windows. They use `memory/ingest_client.py` → backend HTTP ingest endpoint. Ladybug graph DB does not tolerate multi-process access on Windows bind mounts.

Key files:

| File | Role |
|------|------|
| `memory/ingest_client.py` | Workers POST ingest to backend |
| `backend/app/api/v1/memory.py` | `POST /ingest` (202) + `_run_ingest` background task |
| `memory/cognee_session.py` | In-process `asyncio.Lock` for Cognee access |
| `memory/cognee_client.py` | Cognee SDK adapter; `remember_and_improve()` |
| `memory/lifecycle.py` | `ingest_worker_output()` orchestration |
| `memory/env_loader.py` | Loads repo-root `.env` for all processes |

---

## Root causes identified

### 1. Backend process crash (primary on Windows)

With default Cognee settings:

- `GRAPH_DATABASE_SUBPROCESS_ENABLED=true`
- `VECTOR_DB_SUBPROCESS_ENABLED=true`

Cognee spawns Ladybug/LanceDB worker subprocesses during `remember()`. On **Windows**, this can **kill the parent uvicorn process** (exit code 1) immediately after embedding engine / tokenizer init — **no Python traceback**, terminal returns to shell prompt.

**Fix:** disable subprocess mode in `.env`:

```env
GRAPH_DATABASE_SUBPROCESS_ENABLED=false
VECTOR_DB_SUBPROCESS_ENABLED=false
```

Verified: full `remember()` completes in ~30–60s with subprocess mode off.

### 2. Uvicorn `--reload` killing background ingest

`uvicorn --reload` watches files and restarts the server on any change. Background ingest tasks are **not** preserved across reload. A file save during ingest (e.g. editing `memory/cognee_client.py`) aborts ingest mid-pipeline and can leave Ladybug worker subprocesses in a bad state.

**Fix:** run backend **without** `--reload` during ingest testing:

```powershell
python -m uvicorn backend.app.main:app --port 8002
```

### 3. Silent pipeline phase (looks like a hang)

After tokenizer init, Cognee runs embeddings + graph extraction (OpenRouter LLM calls) with **little logging**. A 1–5 minute gap with no new lines can be normal progress, not a freeze.

Look for:

- `Pipeline run started`
- `Completed graph extraction for DataPoint`
- `Cognee remember() finished`
- `Background ingest completed for athlete=...`

### 4. Earlier issues (resolved in same effort)

| Issue | Cause | Fix |
|-------|-------|-----|
| Ladybug storage v40 vs v41 | Host `ladybug==0.16.0`, Docker `0.17.1` | Pin `ladybug==0.17.1` everywhere |
| Docker bind-mount I/O on Windows | Ladybug + multi-process + bind mounts | Run workers on host; Docker only for postgres/minio/redpanda |
| `filelock` deadlocks | Cross-process lock on graph DB | Workers use HTTP ingest; backend uses in-process `asyncio.Lock` |
| `httpx ReadError` on worker → backend | Long sync `remember()` held connection | Ingest returns 202; Cognee runs in `BackgroundTasks` |
| Coach chat 503 `cognee_busy` | Recall blocked while ingest holds lock | Expected; retry after ingest completes |

---

## Benign warnings (ignore)

| Log | Meaning |
|-----|---------|
| HuggingFace tokenizer warning for `openai/text-embedding-3-small` | Model not on HF; TikToken fallback is correct for OpenRouter |
| `Cognee 1.0 changes` | Informational |
| `google.generativeai` FutureWarning | From `instructor` dependency; irrelevant when using OpenRouter |

---

## Required `.env` settings

```env
# Cognee paths (shared with Cognee CLI if same values)
DATA_ROOT_DIRECTORY=D:\PlayGraph-AI\.cognee_data
SYSTEM_ROOT_DIRECTORY=D:\PlayGraph-AI\.cognee_system

# OpenRouter (LLM + embeddings)
EMBEDDING_PROVIDER=openai_compatible
EMBEDDING_MODEL=openai/text-embedding-3-small
EMBEDDING_ENDPOINT=https://openrouter.ai/api/v1
LLM_PROVIDER=custom
LLM_MODEL=openrouter/openai/gpt-4o-mini
LLM_ENDPOINT=https://openrouter.ai/api/v1

# Cognee behavior
COGNEE_SKIP_CONNECTION_TEST=false
ENABLE_BACKEND_ACCESS_CONTROL=false
GRAPH_DATABASE_SUBPROCESS_ENABLED=false
VECTOR_DB_SUBPROCESS_ENABLED=false

# Worker → backend ingest
PLAYGRAPH_API_URL=http://localhost:8002
```

`COGNEE_SKIP_CONNECTION_TEST=false` validates LLM + embedding connectivity at startup instead of failing silently mid-ingest.

Import order: `memory/cognee_client.py` loads `.env` via `load_project_env(override=True)` **before** `import cognee`, so Cognee sees PlayGraph env vars.

---

## Dev commands (hybrid Windows setup)

```powershell
# Infra only (Docker)
cd docker
docker compose -f docker-compose.workers.yml up -d postgres minio redpanda

# Backend (no --reload during ingest)
cd D:\PlayGraph-AI
python -m uvicorn backend.app.main:app --port 8002

# Video worker (host)
$env:PYTHONPATH="."
$env:WORKER_TYPE="video"
python -m workers.main

# Frontend
npm run dev   # port 3002
```

Port map: PlayGraph frontend **3002**, backend **8002**; Cognee CLI UI **3000** / **8000** if run separately.

---

## Success criteria

After video upload, backend terminal should show:

```
POST /api/v1/memory/ingest HTTP/1.1" 202 Accepted
Background ingest started for athlete=... session=... (video_worker)
Cognee remember() starting for dataset=nextplay_ai_<athlete_id> ...
Pipeline run started: ...
Completed graph extraction for DataPoint
Cognee remember() finished for dataset=... session=...
Background ingest completed for athlete=... session=... dataset=...
```

Only then should coach chat / timeline recall be expected to work.

---

## If ingest still fails

1. Confirm backend is still running (no shell prompt; no exit code 1).
2. Confirm subprocess flags are `false` in `.env` and backend was restarted after changing them.
3. Check [openrouter.ai/activity](https://openrouter.ai/activity) for failed embedding/chat requests.
4. Read Cognee log: `%USERPROFILE%\.cognee\logs\` (latest `2026-*` file).
5. Do not run Cognee CLI UI and PlayGraph backend ingest against the same graph DB concurrently on Windows.

---

## Test IDs (2026-07-05 session)

- Athlete: `e937ada2-bd8a-4734-889f-428f3f9aacfb`
- Sessions: `17d2a3df-e1bc-4511-aac5-bf8587767754`, `29cbf2ca-3381-4212-a40d-936efb25742b`
- Cognee dataset: `nextplay_ai_e937ada2-bd8a-4734-889f-428f3f9aacfb`
