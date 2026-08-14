"""ConversationSession persistence operations."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation_session import (
    SESSION_STATUS_ACTIVE,
    SESSION_STATUS_ENDED,
    ConversationSession,
)


class ConversationSessionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: UUID,
        target_language: str,
        native_language: str,
        title: str | None = None,
        status: str = SESSION_STATUS_ACTIVE,
    ) -> ConversationSession:
        session = ConversationSession(
            user_id=user_id,
            target_language=target_language,
            native_language=native_language,
            title=title,
            status=status,
        )
        self.db.add(session)
        self.db.flush()
        self.db.refresh(session)
        return session

    def get_by_id(self, session_id: UUID) -> ConversationSession | None:
        return self.db.get(ConversationSession, session_id)

    def get_by_id_for_user(self, session_id: UUID, user_id: UUID) -> ConversationSession | None:
        stmt = select(ConversationSession).where(
            ConversationSession.id == session_id,
            ConversationSession.user_id == user_id,
        )
        return self.db.scalar(stmt)

    def list_for_user(
        self,
        user_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ConversationSession]:
        stmt = (
            select(ConversationSession)
            .where(ConversationSession.user_id == user_id)
            .order_by(ConversationSession.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt).all())

    def update_title(self, session: ConversationSession, title: str) -> ConversationSession:
        session.title = title
        self.db.flush()
        self.db.refresh(session)
        return session

    def mark_ended(self, session: ConversationSession) -> ConversationSession:
        session.status = SESSION_STATUS_ENDED
        session.ended_at = datetime.now(timezone.utc)
        self.db.flush()
        self.db.refresh(session)
        return session