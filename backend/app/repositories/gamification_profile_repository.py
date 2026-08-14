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

    def update(self, gamification_profile: GamificationProfile, data: dict) -> GamificationProfile:
        for field, value in data.items():
            setattr(gamification_profile, field, value)
        self.db.flush()
        self.db.refresh(gamification_profile)
        return gamification_profile