"""UserExerciseAttempt model — records one submitted answer to one exercise."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserExerciseAttempt(Base):
    """One row per submitted answer — full attempt history, not just the latest."""

    __tablename__ = "user_exercise_attempts"
    __table_args__ = (
        Index("ix_user_exercise_attempts_user_exercise", "user_id", "exercise_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_progress_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_lesson_progress.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    submitted_answer: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    score_awarded: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self) -> str:
        return f"<UserExerciseAttempt id={self.id} exercise_id={self.exercise_id} is_correct={self.is_correct}>"