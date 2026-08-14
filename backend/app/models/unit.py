"""Unit model — a group of lessons within a curriculum, in a fixed order."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Unit(Base):
    """An ordered group of lessons belonging to one curriculum."""

    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("curriculum_id", "order_index", name="uq_units_curriculum_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curriculum_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("curriculums.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    curriculum: Mapped["Curriculum"] = relationship("Curriculum", back_populates="units")
    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson",
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )

    def __repr__(self) -> str:
        return f"<Unit id={self.id} title={self.title!r}>"