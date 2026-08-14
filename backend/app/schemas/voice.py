"""Voice-related schemas for Phase 13."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class TextToSpeechRequest(BaseModel):
    """Request for text-to-speech conversion."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    text: str = Field(..., min_length=1, max_length=500)
    voice: str = Field(default="nova", description="alloy, echo, fable, onyx, nova, shimmer")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class TextToSpeechResponse(BaseModel):
    """Response for text-to-speech conversion."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    audio_base64: str
    voice: str
    speed: float


class PronunciationFeedbackResponse(BaseModel):
    """Pronunciation feedback response."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    transcribed: str
    expected: str
    score: int = Field(..., ge=0, le=100)
    feedback: list[str]
    is_correct: bool


class AudioUploadResponse(BaseModel):
    """Response after audio upload."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    session_id: UUID
    source: str
    audio_url: str
    mime_type: str
    duration_seconds: float | None = None
    created_at: str


class VoiceMessageRequest(BaseModel):
    """Request for voice message."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    audio_base64: str
    language: str = Field(default="en")
    voice: str = Field(default="nova")