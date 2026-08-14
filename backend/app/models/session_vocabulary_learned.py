"""Vocabulary the learner picked up during a conversation session."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SessionVocabularyLearned(Base):
    """A single vocabulary item the AI coach identified as newly learned."""

    __tablename__ = "session_vocabulary_learned"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    word_or_phrase: Mapped[str] = mapped_column(String(255), nullable=False)
    meaning: Mapped[str | None] = mapped_column(Text, nullable=True)
    example_sentence: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<SessionVocabularyLearned id={self.id} session_id={self.session_id}>"