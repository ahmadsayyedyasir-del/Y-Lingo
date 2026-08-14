"""Session coaching report model — end-of-session AI coach summary and scores."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SessionCoachingReport(Base):
    """One-to-one end-of-session coaching summary for a conversation session."""

    __tablename__ = "session_coaching_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    fluency_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    grammar_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vocabulary_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pronunciation_readiness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    strengths: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    weaknesses: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    improvement_tips: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    recommended_practice: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<SessionCoachingReport id={self.id} session_id={self.session_id}>"