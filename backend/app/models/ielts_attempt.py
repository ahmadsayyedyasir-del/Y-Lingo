"""IELTS practice attempt model — stores scores for all IELTS skills."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IELTSAttempt(Base):
    """One row per IELTS practice attempt (writing, reading, listening, speaking, mock)."""

    __tablename__ = "ielts_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Skill: writing | reading | listening | speaking | mock
    skill: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # Raw score (correct answers for reading/listening, word count for writing)
    raw_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Max possible score (total questions)
    max_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Estimated IELTS band (0.0 – 9.0 stored as string e.g. "6.5")
    band_estimate: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # For writing: task type ("task1" | "task2" | "both")
    task_type: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # AI feedback text (writing evaluation, speaking feedback, etc.)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured AI feedback (grammar mistakes, vocabulary, etc.)
    ai_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Task content submitted (essay text, answers dict, etc.)
    submitted_content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<IELTSAttempt id={self.id} skill={self.skill} band={self.band_estimate}>"
