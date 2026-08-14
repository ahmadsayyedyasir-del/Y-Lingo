"""Password reset OTP model — stores 6-digit codes for email-based reset."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PasswordResetCode(Base):
    """One row per issued password-reset OTP. Old codes are never deleted
    automatically — they are simply expired or marked used."""

    __tablename__ = "password_reset_codes"

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
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    is_used: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<PasswordResetCode id={self.id} user_id={self.user_id} used={self.is_used}>"
