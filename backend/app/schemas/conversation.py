"""Pydantic schemas for Conversation APIs (Phase 6 sessions/messages + Phase 7 AI Coach + Phase 9 XP)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.schemas.gamification import GamificationEventResponse


class ConversationSessionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str | None = None
    target_language: str
    native_language: str
    status: str
    created_at: datetime
    updated_at: datetime
    ended_at: datetime | None = None


class ConversationMessageResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    role: str
    content: str
    sequence: int
    created_at: datetime


class ConversationDetailResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    session: ConversationSessionResponse
    messages: list[ConversationMessageResponse]


class ConversationListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[ConversationSessionResponse]
    limit: int
    offset: int


class MessageCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    content: str = Field(..., min_length=1, max_length=4000)


# ---------------------------------------------------------------------------
# Phase 7 — AI Conversation Coach
# ---------------------------------------------------------------------------


class MessageFeedbackResponse(BaseModel):
    """Quiet, per-message live coaching feedback."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    message_id: UUID
    has_mistake: bool
    corrected_text: str | None = None
    explanation: str | None = None
    natural_alternative: str | None = None
    vocabulary_suggestion: str | None = None
    created_at: datetime


class VocabularyLearnedItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    word_or_phrase: str
    meaning: str | None = None
    example_sentence: str | None = None


class GrammarMistakeItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    mistake_text: str
    correction: str
    explanation: str | None = None
    category: str | None = None


class SessionCoachingReportResponse(BaseModel):
    """End-of-session coaching report: scores, summary, vocabulary, mistakes."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    session_id: UUID
    fluency_score: int
    grammar_score: int
    vocabulary_score: int
    pronunciation_readiness_score: int
    strengths: list[str]
    weaknesses: list[str]
    improvement_tips: list[str]
    recommended_practice: str | None = None
    summary: str | None = None
    generated_at: datetime
    updated_at: datetime
    vocabulary_learned: list[VocabularyLearnedItem] = []
    grammar_mistakes: list[GrammarMistakeItem] = []


class MessageCreateResponse(BaseModel):
    """User message plus the AI coach assistant reply, best-effort live feedback,
    and a best-effort gamification summary (Phase 9)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    session: ConversationSessionResponse
    message: ConversationMessageResponse
    assistant_message: ConversationMessageResponse
    feedback: MessageFeedbackResponse | None = None
    gamification: GamificationEventResponse | None = None