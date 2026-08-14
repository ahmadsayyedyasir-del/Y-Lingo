"""User achievement model — records which achievements a user has unlocked.

Achievement *definitions* (name, description, unlock rule) live in code —
app/services/gamification/achievement_registry.py — not in the database, so
adding a new achievement later never requires a migration.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserAchievement(Base):
    """One row per achievement a user has unlocked."""

    __tablename__ = "user_achievements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_code: Mapped[str] = mapped_column(String(50), nullable=False)

    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<UserAchievement id={self.id} user_id={self.user_id} code={self.achievement_code}>"