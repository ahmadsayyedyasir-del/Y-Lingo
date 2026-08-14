"""Lesson model — a single learning unit made of ordered exercises."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Lesson(Base):
    """A single lesson, belonging to one unit, made of ordered exercises."""

    __tablename__ = "lessons"
    __table_args__ = (
        UniqueConstraint("unit_id", "order_index", name="uq_lessons_unit_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_language: Mapped[str] = mapped_column(String(50), nullable=False)
    native_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(20), nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    learning_objectives: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    unit: Mapped["Unit"] = relationship("Unit", back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        "Exercise",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )

    def __repr__(self) -> str:
        return f"<Lesson id={self.id} title={self.title!r}>"