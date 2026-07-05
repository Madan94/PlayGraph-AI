"""Shared MinIO download helpers for Kafka workers."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path


def _minio_client():
    from minio import Minio

    return Minio(
        os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )


def download_file_from_minio(minio_key: str, *, suffix: str | None = None) -> str:
    """Download object to a temp file; caller must delete the path."""
    client = _minio_client()
    bucket = os.getenv("MINIO_BUCKET", "nextplay-assets")
    ext = suffix or Path(minio_key).suffix or ".bin"
    fd, path = tempfile.mkstemp(suffix=ext)
    os.close(fd)
    client.fget_object(bucket, minio_key, path)
    return path


def download_bytes_from_minio(minio_key: str) -> bytes:
    client = _minio_client()
    bucket = os.getenv("MINIO_BUCKET", "nextplay-assets")
    response = client.get_object(bucket, minio_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def download_json_from_minio(minio_key: str) -> dict:
    raw = download_bytes_from_minio(minio_key)
    return json.loads(raw.decode("utf-8"))
