"""Per-message live AI coaching feedback (quiet grammar correction)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MessageFeedback(Base):
    """One-to-one live coaching feedback attached to a single user message."""

    __tablename__ = "message_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversation_messages.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    has_mistake: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    corrected_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    natural_alternative: Mapped[str | None] = mapped_column(Text, nullable=True)
    vocabulary_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<MessageFeedback id={self.id} message_id={self.message_id}>"