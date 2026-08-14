"""AI Conversation schemas for Phase 12 - AI Integration."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Message Schemas
# ---------------------------------------------------------------------------

class MessageSendRequest(BaseModel):
    """Send a message in a conversation session."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(..., min_length=1, max_length=50)
    level: str = Field(default="intermediate")
    scenario: str = Field(default="casual")


class AIResponse(BaseModel):
    """AI response with coaching feedback and gamification event."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    response: str
    grammar_corrections: list[dict] = Field(default_factory=list)
    vocabulary_suggestions: list[dict] = Field(default_factory=list)
    # Gamification — present when XP was awarded, None if gamification was unavailable
    xp_earned: int | None = None
    total_xp: int | None = None
    level: int | None = None
    leveled_up: bool = False
    newly_unlocked_achievements: list[dict] = Field(default_factory=list)


class MessageResponse(BaseModel):
    """Complete message with metadata."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    session_id: UUID
    role: str
    content: str
    sequence: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Session Schemas
# ---------------------------------------------------------------------------

class StartSessionRequest(BaseModel):
    """Start a new conversation session."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    language: str = Field(..., min_length=1, max_length=50)
    native_language: str = Field(..., min_length=1, max_length=50)
    level: str = Field(default="beginner")
    topic: str | None = None
    proficiency_level: str | None = None


class SessionResponse(BaseModel):
    """Conversation session response."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str | None = None
    target_language: str
    native_language: str
    status: str
    created_at: datetime
    ended_at: datetime | None = None


# ---------------------------------------------------------------------------
# Coaching Report Schemas
# ---------------------------------------------------------------------------

class CoachingReportResponse(BaseModel):
    """Complete coaching report for a session."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    session_id: UUID
    fluency_score: int
    grammar_score: int
    vocabulary_score: int
    pronunciation_readiness_score: int
    strengths: list[str]
    weaknesses: list[str]
    improvement_tips: list[str]
    new_vocabulary: list[dict]
    grammar_mistakes: list[dict]
    summary: str
    recommended_practice: str | None = None
    generated_at: datetime


# ---------------------------------------------------------------------------
# History Schemas
# ---------------------------------------------------------------------------

class ConversationHistoryResponse(BaseModel):
    """List of user's conversation sessions with metadata."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sessions: list[SessionResponse]
    total: int

