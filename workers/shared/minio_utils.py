from __future__ import annotations

import os
import tempfile
from pathlib import Path

from minio import Minio


def download_from_minio(minio_key: str, suffix: str | None = None) -> str:
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
    bucket = os.getenv("MINIO_BUCKET", "nextplay-assets")

    client = Minio(
        endpoint,
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=secure,
    )

    tmp_suffix = suffix or Path(minio_key).suffix or ".bin"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=tmp_suffix)
    client.fget_object(bucket, minio_key, tmp.name)
    return tmp.name
