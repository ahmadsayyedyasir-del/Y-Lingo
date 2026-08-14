
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_achievement import UserAchievement


class UserAchievementRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(self, user_id: UUID) -> list[UserAchievement]:
        stmt = (
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_unlocked_codes(self, user_id: UUID) -> set[str]:
        stmt = select(UserAchievement.achievement_code).where(UserAchievement.user_id == user_id)
        return set(self.db.scalars(stmt).all())

    def unlock(self, user_id: UUID, achievement_code: str) -> UserAchievement:
        """Idempotent: returns the existing row instead of inserting a duplicate if already unlocked."""
        stmt = select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_code == achievement_code,
        )
        existing = self.db.scalar(stmt)
        if existing is not None:
            return existing

        row = UserAchievement(user_id=user_id, achievement_code=achievement_code)
        self.db.add(row)
        self.db.flush()
        self.db.refresh(row)
        return row