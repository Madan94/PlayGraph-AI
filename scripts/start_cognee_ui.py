"""Start Cognee CLI UI using the same .env paths as PlayGraph."""

from __future__ import annotations

import cognee
from memory.env_loader import ENV_FILE, load_project_env


def main() -> None:
    load_project_env()
    print(f"Using env file: {ENV_FILE}")
    print("Cognee paths from environment:")
    import os

    print(f"  DATA_ROOT_DIRECTORY={os.getenv('DATA_ROOT_DIRECTORY')}")
    print(f"  SYSTEM_ROOT_DIRECTORY={os.getenv('SYSTEM_ROOT_DIRECTORY')}")
    print("Starting Cognee UI on http://localhost:3000 (API :8000, MCP :8001)...")

    cognee.start_ui(
        lambda _pid: None,
        port=3000,
        start_backend=True,
        backend_port=8000,
        start_mcp=True,
        mcp_port=8001,
        open_browser=True,
    )


if __name__ == "__main__":
    main()
