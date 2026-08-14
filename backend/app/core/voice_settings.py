"""Voice / speech configuration (Phase 8). Loaded from environment."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class VoiceSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Speech-to-text (Groq Whisper) — reuses GROQ_API_KEY from AISettings, not duplicated here.
    stt_model: str = Field(default="whisper-large-v3", description="Groq Whisper model id")
    stt_request_timeout_seconds: float = Field(default=60.0, ge=5.0)
    stt_max_retries: int = Field(default=2, ge=0, le=5)

    # Text-to-speech (ElevenLabs)
    elevenlabs_api_key: str | None = None
    tts_voice_id: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="ElevenLabs voice id")
    tts_model: str = Field(default="eleven_multilingual_v2")
    tts_request_timeout_seconds: float = Field(default=60.0, ge=5.0)
    tts_max_retries: int = Field(default=2, ge=0, le=5)

    # Upload constraints
    max_audio_size_bytes: int = Field(default=15 * 1024 * 1024, description="15 MB max upload")


@lru_cache
def get_voice_settings() -> VoiceSettings:
    return VoiceSettings()