"""UserLessonProgress model — tracks one user's progress through one lesson."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

PROGRESS_STATUS_NOT_STARTED = "not_started"
PROGRESS_STATUS_IN_PROGRESS = "in_progress"
PROGRESS_STATUS_COMPLETED = "completed"
PROGRESS_STATUSES = (PROGRESS_STATUS_NOT_STARTED, PROGRESS_STATUS_IN_PROGRESS, PROGRESS_STATUS_COMPLETED)


class UserLessonProgress(Base):
    """One-to-one-per-lesson progress record for a user (unique on user_id + lesson_id)."""

    __tablename__ = "user_lesson_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress_user_lesson"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PROGRESS_STATUS_NOT_STARTED,
        server_default=PROGRESS_STATUS_NOT_STARTED,
    )
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_percentage: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<UserLessonProgress id={self.id} user_id={self.user_id} lesson_id={self.lesson_id} status={self.status}>"