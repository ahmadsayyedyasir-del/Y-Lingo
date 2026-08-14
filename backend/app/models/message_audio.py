"""Message audio model for voice integration."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MessageAudio(Base):
    """Audio recording for a conversation message."""

    __tablename__ = "message_audio"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    message_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("conversation_messages.id", ondelete="CASCADE"),
        nullable=True,
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # input, generated
    audio_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    duration_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default="now()",
    )

    # Relationships (optional - if not already defined)
    # message: Mapped[ConversationMessage | None] = relationship(...)