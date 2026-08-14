"""UserLessonProgress persistence operations (Phase 10 + Phase 11 admin delete-safety check)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user_lesson_progress import (
    PROGRESS_STATUS_COMPLETED,
    PROGRESS_STATUS_IN_PROGRESS,
    UserLessonProgress,
)


class UserLessonProgressRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_and_lesson(self, user_id: UUID, lesson_id: UUID) -> UserLessonProgress | None:
        stmt = select(UserLessonProgress).where(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.lesson_id == lesson_id,
        )
        return self.db.scalar(stmt)

    def create(self, *, user_id: UUID, lesson_id: UUID) -> UserLessonProgress:
        now = datetime.now(timezone.utc)
        progress = UserLessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            status=PROGRESS_STATUS_IN_PROGRESS,
            attempt_count=1,
            started_at=now,
            last_accessed_at=now,
        )
        self.db.add(progress)
        self.db.flush()
        self.db.refresh(progress)
        return progress

    def update(self, progress: UserLessonProgress, data: dict) -> UserLessonProgress:
        for field, value in data.items():
            setattr(progress, field, value)
        self.db.flush()
        self.db.refresh(progress)
        return progress

    def list_for_user(self, user_id: UUID) -> list[UserLessonProgress]:
        stmt = (
            select(UserLessonProgress)
            .where(UserLessonProgress.user_id == user_id)
            .order_by(UserLessonProgress.last_accessed_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def count_completed_for_user(self, user_id: UUID) -> int:
        stmt = select(func.count()).select_from(UserLessonProgress).where(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.status == PROGRESS_STATUS_COMPLETED,
        )
        return int(self.db.scalar(stmt) or 0)

    def count_for_lessons(self, lesson_ids: list[UUID]) -> int:
        """
        Count of progress rows (any status) across the given lesson ids.
        Used by Phase 11 admin delete endpoints to block deleting content
        that real learners have already started/completed, rather than
        silently cascading their progress away.
        """
        if not lesson_ids:
            return 0
        stmt = select(func.count()).select_from(UserLessonProgress).where(
            UserLessonProgress.lesson_id.in_(lesson_ids)
        )
        return int(self.db.scalar(stmt) or 0)