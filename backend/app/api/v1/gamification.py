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


@router.get("/leaderboard")
def get_leaderboard(
    type: str = "xp",
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Return top users by XP (type=xp) or streak (type=streak).
    Each entry includes rank, username, full_name, xp/streak, level.
    """
    from app.repositories.user_repository import UserRepository

    gam_repo = GamificationProfileRepository(db)
    user_repo = UserRepository(db)

    if type == "streak":
        profiles = gam_repo.get_top_by_streak(limit=min(limit, 50))
    else:
        profiles = gam_repo.get_top_by_xp(limit=min(limit, 50))

    entries = []
    for rank, gp in enumerate(profiles, 1):
        user = user_repo.get_by_id(gp.user_id)
        if user is None:
            continue
        entries.append({
            "rank": rank,
            "user_id": str(gp.user_id),
            "username": user.username,
            "full_name": user.full_name,
            "total_xp": gp.total_xp,
            "level": (gp.total_xp // 100) + 1,
            "current_streak_days": gp.current_streak_days,
            "is_current_user": gp.user_id == current_user.id,
        })

    return {
        "type": type,
        "entries": entries,
        "total": len(entries),
    }