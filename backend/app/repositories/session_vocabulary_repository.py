
from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.session_vocabulary_learned import SessionVocabularyLearned

_MAX_ITEMS_PER_SESSION = 20


class SessionVocabularyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def replace_for_session(
        self,
        session_id: UUID,
        items: list[dict],
    ) -> list[SessionVocabularyLearned]:
        """Replace all vocabulary rows for a session with a new AI-generated set."""
        if not isinstance(items, list):
            items = []

        self.db.execute(
            delete(SessionVocabularyLearned).where(SessionVocabularyLearned.session_id == session_id)
        )

        rows: list[SessionVocabularyLearned] = []
        for item in items[:_MAX_ITEMS_PER_SESSION]:
            if not isinstance(item, dict):
                continue
            word = str(item.get("word") or "").strip()
            if not word:
                continue
            row = SessionVocabularyLearned(
                session_id=session_id,
                word_or_phrase=word[:255],
                meaning=self._clean(item.get("meaning")),
                example_sentence=self._clean(item.get("example")),
            )
            self.db.add(row)
            rows.append(row)

        self.db.flush()
        for row in rows:
            self.db.refresh(row)
        return rows

    def list_for_session(self, session_id: UUID) -> list[SessionVocabularyLearned]:
        stmt = (
            select(SessionVocabularyLearned)
            .where(SessionVocabularyLearned.session_id == session_id)
            .order_by(SessionVocabularyLearned.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    @staticmethod
    def _clean(value: object) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None