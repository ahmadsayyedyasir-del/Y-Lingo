"""Profile API routes — thin layer: validate, call service, return response."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest
from app.services.profile_service import ProfileService
from app.services.storage import StorageService
from app.services.storage.local_storage_service import LocalStorageService

router = APIRouter(prefix="/profile", tags=["Profile"])


def get_storage_service() -> StorageService:
    """Provide the active storage backend."""
    return LocalStorageService()


def get_profile_service(
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
) -> ProfileService:
    return ProfileService(
        profile_repository=ProfileRepository(db),
        user_repository=UserRepository(db),
        storage_service=storage_service,
    )


@router.get(
    "",
    response_model=ProfileResponse,
    response_model_by_alias=False,
)
def get_profile(
    current_user: User = Depends(get_current_active_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    """
    Return the authenticated user's complete profile.

    response_model_by_alias=False is intentional:
    the frontend expects snake_case fields such as avatar_url.
    """
    return service.get_profile(current_user)


@router.put(
    "",
    response_model=ProfileResponse,
    response_model_by_alias=False,
)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    """
    Update the authenticated user's profile.
    """
    return service.update_profile(current_user, payload)


@router.post(
    "/avatar",
    response_model=ProfileResponse,
    response_model_by_alias=False,
)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    """
    Upload an avatar, persist avatar_url, and return the updated profile.

    The response intentionally uses snake_case so the frontend can read
    response.data.avatar_url directly.
    """
    return service.upload_avatar(current_user, file)