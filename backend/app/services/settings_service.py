"""Business logic for the Settings module."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest


class SettingsService:
    def __init__(self, settings_repository: SettingsRepository) -> None:
        self.settings_repository = settings_repository

    def get_settings(self, current_user: User) -> SettingsResponse:
        settings = self.settings_repository.get_by_user_id(current_user.id)
        if settings is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not found.")

        return SettingsResponse(
            theme=settings.theme,
            grammar_correction=settings.grammar_correction,
            translation_enabled=settings.translation_enabled,
            ai_voice=settings.ai_voice,
            ai_speed=settings.ai_speed,
            email_notifications=settings.email_notifications,
            daily_reminders=settings.daily_reminders,
        )

    def update_settings(self, current_user: User, payload: SettingsUpdateRequest) -> SettingsResponse:
        settings = self.settings_repository.get_by_user_id(current_user.id)
        if settings is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not found.")

        update_data = payload.model_dump()
        updated_settings = self.settings_repository.update(settings, update_data)

        return SettingsResponse(
            theme=updated_settings.theme,
            grammar_correction=updated_settings.grammar_correction,
            translation_enabled=updated_settings.translation_enabled,
            ai_voice=updated_settings.ai_voice,
            ai_speed=updated_settings.ai_speed,
            email_notifications=updated_settings.email_notifications,
            daily_reminders=updated_settings.daily_reminders,
        )