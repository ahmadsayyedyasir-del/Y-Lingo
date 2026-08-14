"""Dashboard API routes — thin layer: validate, call service, return response."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(
        profile_repository=ProfileRepository(db),
        gamification_profile_repository=GamificationProfileRepository(db),
    )


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_active_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    return service.get_dashboard(current_user)
