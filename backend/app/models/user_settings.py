"""Per-user product and AI Coach preferences."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class UserSettings(TimestampMixin, Base):
    """One-to-one settings row per user."""

    __tablename__ = "user_settings"

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
    ai_speed: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="normal",
        server_default="normal",
    )
    ai_voice: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="female",
        server_default="female",
    )
    grammar_correction: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    translation_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    daily_reminders: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    theme: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="dark",
        server_default="dark",
    )

    user: Mapped[User] = relationship("User", back_populates="settings")

    def __repr__(self) -> str:
        return f"<UserSettings id={self.id} user_id={self.user_id}>"