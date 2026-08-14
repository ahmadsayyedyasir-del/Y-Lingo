"""Exercise model — a single graded activity within a lesson."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

EXERCISE_TYPE_MULTIPLE_CHOICE = "multiple_choice"
EXERCISE_TYPE_TRANSLATION = "translation"
EXERCISE_TYPE_FILL_IN_BLANK = "fill_in_blank"
EXERCISE_TYPE_SENTENCE_CORRECTION = "sentence_correction"
EXERCISE_TYPE_VOCABULARY = "vocabulary"
EXERCISE_TYPE_LISTENING = "listening"
EXERCISE_TYPES = (
    EXERCISE_TYPE_MULTIPLE_CHOICE,
    EXERCISE_TYPE_TRANSLATION,
    EXERCISE_TYPE_FILL_IN_BLANK,
    EXERCISE_TYPE_SENTENCE_CORRECTION,
    EXERCISE_TYPE_VOCABULARY,
    EXERCISE_TYPE_LISTENING,
)


class Exercise(Base):
    """
    A single graded activity within a lesson.

    `content` (JSONB) holds type-specific data, including the correct
    answer(s) — see app/services/exercise_grading.py for the documented
    shape per exercise_type and for the sanitization step that strips
    answers before a lesson is ever shown to a client.
    """

    __tablename__ = "exercises"
    __table_args__ = (
        UniqueConstraint("lesson_id", "order_index", name="uq_exercises_lesson_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    exercise_type: Mapped[str] = mapped_column(String(30), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="exercises")

    def __repr__(self) -> str:
        return f"<Exercise id={self.id} type={self.exercise_type}>"