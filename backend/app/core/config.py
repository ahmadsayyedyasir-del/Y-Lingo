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

    app_name: str = Field(default="Y-Lingo API")
    app_env: str = Field(default="development")
    debug: bool = Field(default=False)
    api_v1_prefix: str = Field(default="/api/v1")

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
    )

    database_url: str = Field(
        default="postgresql+psycopg://user:password@localhost:5432/ylingodb",
    )

    log_level: str = Field(default="INFO")

    jwt_secret: str = Field(
        default="CHANGE-ME-IN-PRODUCTION-USE-A-LONG-RANDOM-SECRET",
        description="HMAC secret for access tokens",
    )
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    refresh_token_expire_days: int = Field(default=14)

    # Groq API Key
    groq_api_key: str | None = Field(default=None, description="Groq API key for AI conversations")

    # OpenAI API Key (Optional - for voice features)
    openai_api_key: str | None = Field(default=None, description="OpenAI API key for STT/TTS")

    # AI Provider Configuration
    ai_provider: str = Field(default="groq", description="AI provider: groq, openai")
    ai_model: str = Field(default="llama-3.3-70b-versatile", description="AI model name")

    # ✅ ADD THIS LINE
    embedding_provider: str | None = Field(default=None, description="Embedding provider: sentence-transformers, openai")

    # Email / SMTP settings (used for password reset OTP)
    smtp_host: str = Field(default="smtp.gmail.com", description="SMTP server host")
    smtp_port: int = Field(default=587, description="SMTP server port (587=TLS, 465=SSL)")
    smtp_username: str | None = Field(default=None, description="SMTP login username / email address")
    smtp_password: str | None = Field(default=None, description="SMTP login password or app password")
    smtp_from_email: str | None = Field(default=None, description="From address shown in sent emails")
    smtp_from_name: str = Field(default="Y-Lingo", description="From name shown in sent emails")
    smtp_use_tls: bool = Field(default=True, description="Use STARTTLS (port 587)")

    # Password reset OTP settings
    password_reset_code_expire_minutes: int = Field(default=15, description="OTP validity in minutes")

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
    return Settings()


settings = get_settings()