"""ConversationMessage persistence operations."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.conversation_message import MESSAGE_ROLE_USER, ConversationMessage


class ConversationMessageRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def next_sequence(self, session_id: UUID) -> int:
        stmt = select(func.coalesce(func.max(ConversationMessage.sequence), 0)).where(
            ConversationMessage.session_id == session_id
        )
        current_max = self.db.scalar(stmt) or 0
        return int(current_max) + 1

    def add(
        self,
        *,
        session_id: UUID,
        content: str,
        role: str = MESSAGE_ROLE_USER,
        sequence: int | None = None,
    ) -> ConversationMessage:
        if sequence is None:
            sequence = self.next_sequence(session_id)

        message = ConversationMessage(
            session_id=session_id,
            role=role,
            content=content,
            sequence=sequence,
        )
        self.db.add(message)
        self.db.flush()
        self.db.refresh(message)
        return message

    def list_for_session(self, session_id: UUID) -> list[ConversationMessage]:
        stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.session_id == session_id)
            .order_by(ConversationMessage.sequence.asc())
        )
        return list(self.db.scalars(stmt).all())

    def count_for_session(self, session_id: UUID) -> int:
        stmt = select(func.count()).select_from(ConversationMessage).where(
            ConversationMessage.session_id == session_id
        )
        return int(self.db.scalar(stmt) or 0)