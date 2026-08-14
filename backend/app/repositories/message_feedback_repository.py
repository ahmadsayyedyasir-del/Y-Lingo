

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message_feedback import MessageFeedback


class MessageFeedbackRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(
        self,
        *,
        message_id: UUID,
        session_id: UUID,
        has_mistake: bool,
        corrected_text: str | None = None,
        explanation: str | None = None,
        natural_alternative: str | None = None,
        vocabulary_suggestion: str | None = None,
    ) -> MessageFeedback:
        feedback = MessageFeedback(
            message_id=message_id,
            session_id=session_id,
            has_mistake=has_mistake,
            corrected_text=corrected_text,
            explanation=explanation,
            natural_alternative=natural_alternative,
            vocabulary_suggestion=vocabulary_suggestion,
        )
        self.db.add(feedback)
        self.db.flush()
        self.db.refresh(feedback)
        return feedback

    def get_by_message_id(self, message_id: UUID) -> MessageFeedback | None:
        stmt = select(MessageFeedback).where(MessageFeedback.message_id == message_id)
        return self.db.scalar(stmt)

    def list_for_session(self, session_id: UUID) -> list[MessageFeedback]:
        stmt = (
            select(MessageFeedback)
            .where(MessageFeedback.session_id == session_id)
            .order_by(MessageFeedback.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())