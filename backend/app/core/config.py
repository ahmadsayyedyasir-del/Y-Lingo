"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Y-Lingo API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="Y-Lingo API", description="Service display name")
    app_env: str = Field(default="development", description="development | staging | production")
    debug: bool = Field(default=False)
    api_v1_prefix: str = Field(default="/api/v1")

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated allowed origins",
    )

    database_url: str = Field(
        default="postgresql+psycopg2://user:password@localhost:5432/ylingodb",
        description="SQLAlchemy database URL (used from DB phase onward)",
    )

    log_level: str = Field(default="INFO")

    @field_validator("app_env")
    @classmethod
    def normalize_env(cls, value: str) -> str:
        return value.strip().lower()

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — safe for FastAPI Depends."""
    return Settings()