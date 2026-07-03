from pydantic_settings import BaseSettings, SettingsConfigDict


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

    qwen_api_url: str = ""
    qwen_api_key: str = ""
    qwen_model: str = "qwen-plus"

    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
