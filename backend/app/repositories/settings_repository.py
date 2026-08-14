"""UserSettings persistence operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_settings import UserSettings


class SettingsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: UUID) -> UserSettings | None:
        stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        return self.db.scalar(stmt)

    def update(self, settings: UserSettings, data: dict) -> UserSettings:
        for field, value in data.items():
            setattr(settings, field, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings