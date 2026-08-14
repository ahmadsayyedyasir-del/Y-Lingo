"""Business logic for the Dashboard module."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.dashboard import AchievementItem, ActivityItem, DashboardResponse, WeeklyProgressPoint
from app.services.gamification_service import GamificationService

_EMPTY_WEEKLY_PROGRESS: list[WeeklyProgressPoint] = [
    WeeklyProgressPoint(day="Mon", xp=0),
    WeeklyProgressPoint(day="Tue", xp=0),
    WeeklyProgressPoint(day="Wed", xp=0),
    WeeklyProgressPoint(day="Thu", xp=0),
    WeeklyProgressPoint(day="Fri", xp=0),
    WeeklyProgressPoint(day="Sat", xp=0),
    WeeklyProgressPoint(day="Sun", xp=0),
]

_EMPTY_RECENT_ACTIVITY: list[ActivityItem] = []


class DashboardService:
    def __init__(
        self,
        profile_repository: ProfileRepository,
        gamification_profile_repository: GamificationProfileRepository,
    ) -> None:
        self.profile_repository = profile_repository
        self.gamification_profile_repository = gamification_profile_repository

    def get_dashboard(self, current_user: User) -> DashboardResponse:
        profile = self.profile_repository.get_by_user_id(current_user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

        # Fetch real gamification data — get_or_create ensures a row always exists
        gp = self.gamification_profile_repository.get_or_create(current_user.id)
        current_level = GamificationService.compute_level(gp.total_xp)

        return DashboardResponse(
            full_name=current_user.full_name,
            avatar_url=profile.avatar_url,
            native_language=profile.native_language,
            learning_language=profile.learning_language,
            learning_style=profile.learning_style,
            daily_goal=profile.daily_goal,
            current_xp=gp.total_xp,
            current_level=current_level,
            current_streak=gp.current_streak_days,
            weekly_progress=_EMPTY_WEEKLY_PROGRESS,
            achievements=[],
            recent_activity=_EMPTY_RECENT_ACTIVITY,
        )
