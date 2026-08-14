"""Business logic for the Profile module."""

from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

from app.core.file_validation import validate_image_upload
from app.models.profile import Profile
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest
from app.services.storage import StorageService

# Fields that count toward profile completeness (equal weight).
_COMPLETION_FIELD_COUNT = 6


class ProfileService:
    def __init__(
        self,
        profile_repository: ProfileRepository,
        user_repository: UserRepository,
        storage_service: StorageService,
    ) -> None:
        self.profile_repository = profile_repository
        self.user_repository = user_repository
        self.storage_service = storage_service

    def get_profile(self, current_user: User) -> ProfileResponse:
        profile = self.profile_repository.get_by_user_id(current_user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

        return self._to_response(current_user, profile)

    def update_profile(self, current_user: User, payload: ProfileUpdateRequest) -> ProfileResponse:
        profile = self.profile_repository.get_by_user_id(current_user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

        # Only update full_name when explicitly provided
        if payload.full_name and payload.full_name.strip():
            updated_user = self.user_repository.update_full_name(current_user, payload.full_name.strip())
        else:
            updated_user = current_user

        profile_data = payload.model_dump(exclude={"full_name"}, exclude_none=False)
        updated_profile = self.profile_repository.update(profile, profile_data)

        return self._to_response(updated_user, updated_profile)

    def upload_avatar(self, current_user: User, file: UploadFile) -> ProfileResponse:
        """
        Validate the image, store the new file first, then remove any previous
        avatar, persist the new public URL, and return the full profile payload.
        """
        profile = self.profile_repository.get_by_user_id(current_user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

        validate_image_upload(file)

        previous_url = profile.avatar_url

        # Write the new file before deleting the old one so a failed save
        # cannot leave the user without an avatar.
        new_avatar_url = self.storage_service.save(
            file,
            filename_prefix=str(current_user.id),
        )

        updated_profile = self.profile_repository.update(
            profile,
            {"avatar_url": new_avatar_url},
        )

        if previous_url and previous_url != new_avatar_url:
            self.storage_service.delete(previous_url)

        return self._to_response(current_user, updated_profile)

    def _calculate_completion(self, user: User, profile: Profile) -> tuple[int, bool]:
        """
        Deterministic profile-completeness score.

        Returns (profile_completion 0-100, is_profile_complete).
        """
        checks = (
            bool(user.full_name and user.full_name.strip()),
            bool(profile.bio and profile.bio.strip()),
            bool(profile.avatar_url and str(profile.avatar_url).strip()),
            bool(profile.native_language and profile.native_language.strip()),
            bool(profile.learning_language and profile.learning_language.strip()),
            bool(profile.learning_style and profile.learning_style.strip()),
        )
        filled = sum(1 for ok in checks if ok)
        percentage = round((filled / _COMPLETION_FIELD_COUNT) * 100)
        return percentage, percentage == 100

    def _to_response(self, user: User, profile: Profile) -> ProfileResponse:
        """Single mapping path so GET / PUT / avatar stay consistent."""
        completion, is_complete = self._calculate_completion(user, profile)

        return ProfileResponse(
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            native_language=profile.native_language,
            learning_language=profile.learning_language,
            level=profile.level,
            learning_style=profile.learning_style,
            daily_goal=profile.daily_goal,
            profile_completion=completion,
            is_profile_complete=is_complete,
        )