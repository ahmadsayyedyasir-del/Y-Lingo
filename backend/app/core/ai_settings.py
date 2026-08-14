"""AI / LLM configuration (Phase 7). Loaded from environment."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_provider: str = Field(default="groq", description="groq | openai")
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    ai_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Model id for the active provider",
    )
    ai_max_context_messages: int = Field(default=20, ge=2, le=100)
    ai_request_timeout_seconds: float = Field(default=60.0, ge=5.0)
    ai_max_retries: int = Field(default=2, ge=0, le=5)
    ai_temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    ai_max_tokens: int = Field(default=1024, ge=64, le=8192)


@lru_cache
def get_ai_settings() -> AISettings:
    return AISettings()