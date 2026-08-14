"""Grammar mistakes identified by the AI coach during a conversation session."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SessionGrammarMistake(Base):
    """A single grammar mistake the AI coach identified during a session."""

    __tablename__ = "session_grammar_mistakes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    mistake_text: Mapped[str] = mapped_column(Text, nullable=False)
    correction: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<SessionGrammarMistake id={self.id} session_id={self.session_id}>"