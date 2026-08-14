"""Gamification profile model — one-to-one per user: XP/streak source data.
Profile.level (existing field) stays the single source of truth for level;
this table stores the raw counters that level and streaks are computed from."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GamificationProfile(Base):
    """One-to-one gamification stats record per user."""

    __tablename__ = "gamification_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    total_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_messages_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_sessions_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    current_streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    longest_streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
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
        return f"<GamificationProfile id={self.id} user_id={self.user_id} xp={self.total_xp}>"