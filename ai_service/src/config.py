"""Configuration for AI Service."""
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_grpc_port: int = 6334
    qdrant_api_key: str = ""

    collection_articles: str = "health_articles"
    collection_products: str = "health_products"
    vector_size: int = 768

    gemini_api_key: str = ""

    java_backend_url: str = "http://localhost:8080"

    # Shared secret với BE (BE sẽ set header `X-Internal-Token`).
    ai_internal_token: str = ""

    # Hostname của chính service này (dùng trong logging / docs).
    service_host: str = "0.0.0.0"
    service_port: int = 8000


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
