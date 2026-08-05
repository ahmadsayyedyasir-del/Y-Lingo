"""Learner profile — languages, goals, presentation."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Profile(TimestampMixin, Base):
    """One-to-one learning profile per user."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    native_language: Mapped[str] = mapped_column(String(50), nullable=False, default="English")
    learning_language: Mapped[str] = mapped_column(String(50), nullable=False, default="Spanish")
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    learning_style: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="conversation-first",
        server_default="conversation-first",
    )
    daily_goal: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=50,
        server_default="50",
        doc="Daily XP goal",
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped[User] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile id={self.id} user_id={self.user_id}>"