from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ENV_FILE = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.is_file() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://nextplay:nextplay@localhost:5432/nextplay"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    jwt_cookie_name: str = "pg_session"

    auth_internal_service_key: str = ""
    otp_length: int = 6
    otp_ttl_minutes: int = 10
    otp_max_attempts: int = 5

    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "nextplay-assets"
    minio_secure: bool = False

    kafka_bootstrap_servers: str = "localhost:9092"
    cognee_dataset: str = "nextplay_ai"
    cognee_mode: str = "embedded"
    cognee_base_url: str = ""
    cognee_api_key: str = ""

    backend_port: int = 8002
    frontend_port: int = 3002
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3002"]
    qwen_api_url: str = ""
    qwen_api_key: str = ""
    qwen_model: str = "openai/gpt-4o"

    vision_api_url: str = ""
    vision_api_key: str = ""
    vision_model: str = "openai/gpt-4o"
    vision_synth_model: str = "openai/gpt-4o-mini"
    vision_max_frames: int = 10

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
