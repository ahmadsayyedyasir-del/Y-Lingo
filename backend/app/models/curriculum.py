"""Curriculum model — a structured learning path for a target language."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

DIFFICULTY_BEGINNER = "beginner"
DIFFICULTY_INTERMEDIATE = "intermediate"
DIFFICULTY_ADVANCED = "advanced"
DIFFICULTY_LEVELS = (DIFFICULTY_BEGINNER, DIFFICULTY_INTERMEDIATE, DIFFICULTY_ADVANCED)


class Curriculum(Base):
    """A structured, ordered learning path (made of units, made of lessons)."""

    __tablename__ = "curriculums"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_language: Mapped[str] = mapped_column(String(50), nullable=False)
    native_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(20), nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    units: Mapped[list["Unit"]] = relationship(
        "Unit",
        back_populates="curriculum",
        cascade="all, delete-orphan",
        order_by="Unit.order_index",
    )

    def __repr__(self) -> str:
        return f"<Curriculum id={self.id} title={self.title!r}>"