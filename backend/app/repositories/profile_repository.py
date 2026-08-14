"""Profile persistence operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import Profile


class ProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: UUID) -> Profile | None:
        stmt = select(Profile).where(Profile.user_id == user_id)
        return self.db.scalar(stmt)

    def update(self, profile: Profile, data: dict) -> Profile:
        for field, value in data.items():
            setattr(profile, field, value)
        self.db.commit()
        self.db.refresh(profile)
        return profile