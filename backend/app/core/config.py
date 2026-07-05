from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://nextplay:nextplay@localhost:5432/nextplay"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "nextplay-assets"
    minio_secure: bool = False

    kafka_bootstrap_servers: str = "localhost:9092"
    cognee_dataset: str = "nextplay_ai"

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
