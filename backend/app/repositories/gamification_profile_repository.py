"""GamificationProfile persistence operations (Phase 9)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.gamification_profile import GamificationProfile


class GamificationProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: UUID) -> GamificationProfile | None:
        stmt = select(GamificationProfile).where(GamificationProfile.user_id == user_id)
        return self.db.scalar(stmt)

    def get_or_create(self, user_id: UUID) -> GamificationProfile:
        existing = self.get_by_user_id(user_id)
        if existing is not None:
            return existing

        gp = GamificationProfile(user_id=user_id)
        self.db.add(gp)
        self.db.flush()
        self.db.refresh(gp)
        return gp

    def get_top_by_xp(self, limit: int = 20) -> list[GamificationProfile]:
        """Return top N profiles ordered by total_xp descending."""
        stmt = (
            select(GamificationProfile)
            .where(GamificationProfile.total_xp > 0)
            .order_by(GamificationProfile.total_xp.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_top_by_streak(self, limit: int = 20) -> list[GamificationProfile]:
        """Return top N profiles ordered by current_streak_days descending."""
        stmt = (
            select(GamificationProfile)
            .where(GamificationProfile.current_streak_days > 0)
            .order_by(GamificationProfile.current_streak_days.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def update(self, gamification_profile: GamificationProfile, data: dict) -> GamificationProfile:
        for field, value in data.items():
            setattr(gamification_profile, field, value)
        self.db.flush()
        self.db.refresh(gamification_profile)
        return gamification_profile