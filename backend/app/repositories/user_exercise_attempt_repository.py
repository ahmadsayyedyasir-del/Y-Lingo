
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user_exercise_attempt import UserExerciseAttempt


class UserExerciseAttemptRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(
        self,
        *,
        user_id: UUID,
        exercise_id: UUID,
        lesson_progress_id: UUID,
        submitted_answer: dict,
        is_correct: bool,
        score_awarded: int,
        attempt_number: int,
    ) -> UserExerciseAttempt:
        attempt = UserExerciseAttempt(
            user_id=user_id,
            exercise_id=exercise_id,
            lesson_progress_id=lesson_progress_id,
            submitted_answer=submitted_answer,
            is_correct=is_correct,
            score_awarded=score_awarded,
            attempt_number=attempt_number,
        )
        self.db.add(attempt)
        self.db.flush()
        self.db.refresh(attempt)
        return attempt

    def count_attempts(self, user_id: UUID, exercise_id: UUID) -> int:
        stmt = select(func.count()).select_from(UserExerciseAttempt).where(
            UserExerciseAttempt.user_id == user_id,
            UserExerciseAttempt.exercise_id == exercise_id,
        )
        return int(self.db.scalar(stmt) or 0)

    def list_correct_exercise_ids_for_progress(
        self,
        lesson_progress_id: UUID,
        *,
        since: datetime | None = None,
    ) -> set[UUID]:
        """Distinct exercise ids with at least one correct attempt, optionally only
        counting attempts made since `since` (used to ignore stale attempts from a
        prior run when a completed lesson is restarted)."""
        stmt = select(UserExerciseAttempt.exercise_id).where(
            UserExerciseAttempt.lesson_progress_id == lesson_progress_id,
            UserExerciseAttempt.is_correct.is_(True),
        )
        if since is not None:
            stmt = stmt.where(UserExerciseAttempt.created_at >= since)
        stmt = stmt.distinct()
        return set(self.db.scalars(stmt).all())

    def sum_best_score_for_progress(
        self,
        lesson_progress_id: UUID,
        *,
        since: datetime | None = None,
    ) -> int:
        """Sum of each exercise's best score_awarded within this progress run."""
        stmt = select(
            UserExerciseAttempt.exercise_id,
            func.max(UserExerciseAttempt.score_awarded),
        ).where(UserExerciseAttempt.lesson_progress_id == lesson_progress_id)
        if since is not None:
            stmt = stmt.where(UserExerciseAttempt.created_at >= since)
        stmt = stmt.group_by(UserExerciseAttempt.exercise_id)
        rows = self.db.execute(stmt).all()
        return sum(score for _, score in rows)