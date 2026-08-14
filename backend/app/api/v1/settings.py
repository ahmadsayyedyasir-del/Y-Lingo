"""Settings API routes — thin layer: validate, call service, return response."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(settings_repository=SettingsRepository(db))


@router.get("", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_active_user),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsResponse:
    return service.get_settings(current_user)


@router.put("", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsResponse:
    return service.update_settings(current_user, payload)