"""Load repo-root .env so all processes share the same Cognee paths."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = REPO_ROOT / ".env"


def load_project_env(*, override: bool = False) -> Path:
    """Load D:\\PlayGraph-AI\\.env (or repo .env) into os.environ."""
    if ENV_FILE.is_file():
        load_dotenv(ENV_FILE, override=override)
    return REPO_ROOT
