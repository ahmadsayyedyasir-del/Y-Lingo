"""Conversation session model — one practice thread owned by a user."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Allowed status values (enforced in DB via CheckConstraint in migration).
SESSION_STATUS_ACTIVE = "active"
SESSION_STATUS_ENDED = "ended"
SESSION_STATUSES = (SESSION_STATUS_ACTIVE, SESSION_STATUS_ENDED)


class ConversationSession(Base):
    __tablename__ = "conversation_sessions"

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

    # Set by the service from the first user message (truncated). Nullable until then.
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)

    target_language: Mapped[str] = mapped_column(String(50), nullable=False)
    native_language: Mapped[str] = mapped_column(String(50), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SESSION_STATUS_ACTIVE,
        server_default=SESSION_STATUS_ACTIVE,
    )

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
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    messages: Mapped[list["ConversationMessage"]] = relationship(
        "ConversationMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.sequence",
    )