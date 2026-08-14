

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.session_coaching_report import SessionCoachingReport


class SessionCoachingReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_session_id(self, session_id: UUID) -> SessionCoachingReport | None:
        stmt = select(SessionCoachingReport).where(SessionCoachingReport.session_id == session_id)
        return self.db.scalar(stmt)

    def upsert(
        self,
        *,
        session_id: UUID,
        fluency_score: int,
        grammar_score: int,
        vocabulary_score: int,
        pronunciation_readiness_score: int,
        strengths: list[str],
        weaknesses: list[str],
        improvement_tips: list[str],
        recommended_practice: str | None,
        summary: str | None,
    ) -> SessionCoachingReport:
        existing = self.get_by_session_id(session_id)

        if existing is not None:
            existing.fluency_score = fluency_score
            existing.grammar_score = grammar_score
            existing.vocabulary_score = vocabulary_score
            existing.pronunciation_readiness_score = pronunciation_readiness_score
            existing.strengths = strengths
            existing.weaknesses = weaknesses
            existing.improvement_tips = improvement_tips
            existing.recommended_practice = recommended_practice
            existing.summary = summary
            self.db.flush()
            self.db.refresh(existing)
            return existing

        report = SessionCoachingReport(
            session_id=session_id,
            fluency_score=fluency_score,
            grammar_score=grammar_score,
            vocabulary_score=vocabulary_score,
            pronunciation_readiness_score=pronunciation_readiness_score,
            strengths=strengths,
            weaknesses=weaknesses,
            improvement_tips=improvement_tips,
            recommended_practice=recommended_practice,
            summary=summary,
        )
        self.db.add(report)
        self.db.flush()
        self.db.refresh(report)
        return report