

from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.session_grammar_mistake import SessionGrammarMistake

_MAX_ITEMS_PER_SESSION = 20


class SessionGrammarMistakeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def replace_for_session(
        self,
        session_id: UUID,
        items: list[dict],
    ) -> list[SessionGrammarMistake]:
        """Replace all grammar-mistake rows for a session with a new AI-generated set."""
        if not isinstance(items, list):
            items = []

        self.db.execute(
            delete(SessionGrammarMistake).where(SessionGrammarMistake.session_id == session_id)
        )

        rows: list[SessionGrammarMistake] = []
        for item in items[:_MAX_ITEMS_PER_SESSION]:
            if not isinstance(item, dict):
                continue
            mistake_text = str(item.get("mistake") or "").strip()
            correction = str(item.get("correction") or "").strip()
            if not mistake_text or not correction:
                continue
            row = SessionGrammarMistake(
                session_id=session_id,
                mistake_text=mistake_text,
                correction=correction,
                explanation=self._clean(item.get("explanation")),
                category=self._clean(item.get("category"), max_length=100),
            )
            self.db.add(row)
            rows.append(row)

        self.db.flush()
        for row in rows:
            self.db.refresh(row)
        return rows

    def list_for_session(self, session_id: UUID) -> list[SessionGrammarMistake]:
        stmt = (
            select(SessionGrammarMistake)
            .where(SessionGrammarMistake.session_id == session_id)
            .order_by(SessionGrammarMistake.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    @staticmethod
    def _clean(value: object, *, max_length: int | None = None) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        return text[:max_length] if max_length else text