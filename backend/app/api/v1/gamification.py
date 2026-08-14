"""Gamification API routes — thin layer: auth, call service, return schema."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_achievement_repository import UserAchievementRepository
from app.schemas.gamification import (
    AchievementCatalogResponse,
    AchievementResponse,
    GamificationProfileResponse,
)
from app.services.gamification.achievement_registry import ACHIEVEMENTS
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["Gamification"])


def get_gamification_service(db: Session = Depends(get_db)) -> GamificationService:
    return GamificationService(
        gamification_profile_repository=GamificationProfileRepository(db),
        user_achievement_repository=UserAchievementRepository(db),
        profile_repository=ProfileRepository(db),
    )


@router.get("/profile", response_model=GamificationProfileResponse)
def get_gamification_profile(
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_gamification_service),
) -> GamificationProfileResponse:
    gp, unlocked_codes = service.get_or_create_summary(current_user)
    return GamificationProfileResponse(
        total_xp=gp.total_xp,
        level=service.compute_level(gp.total_xp),
        total_messages_sent=gp.total_messages_sent,
        total_sessions_completed=gp.total_sessions_completed,
        current_streak_days=gp.current_streak_days,
        longest_streak_days=gp.longest_streak_days,
        last_activity_date=gp.last_activity_date,
        achievements_unlocked_count=len(unlocked_codes),
        achievements_total_count=len(ACHIEVEMENTS),
    )


@router.get("/achievements", response_model=AchievementCatalogResponse)
def get_achievement_catalog(
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_gamification_service),
) -> AchievementCatalogResponse:
    unlocked_map = service.get_unlocked_achievements_map(current_user)
    items = [
        AchievementResponse(
            code=definition.code,
            name=definition.name,
            description=definition.description,
            category=definition.category,
            unlocked=definition.code in unlocked_map,
            unlocked_at=unlocked_map.get(definition.code),
        )
        for definition in ACHIEVEMENTS
    ]
    return AchievementCatalogResponse(items=items)