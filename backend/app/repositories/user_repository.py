"""User persistence operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.user import User
from app.models.user_settings import UserSettings


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower().strip())
        return self.db.scalar(stmt)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username.lower().strip())
        return self.db.scalar(stmt)

    def create_user_with_defaults(
        self,
        *,
        full_name: str,
        username: str,
        email: str,
        hashed_password: str,
    ) -> User:
        """Create User + Profile + UserSettings in the current transaction."""
        user = User(
            full_name=full_name,
            username=username.lower().strip(),
            email=email.lower().strip(),
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        self.db.flush()

        profile = Profile(user_id=user.id)
        settings = UserSettings(user_id=user.id)
        self.db.add(profile)
        self.db.add(settings)
        self.db.flush()
        return user

    def update_full_name(self, user: User, full_name: str) -> User:
        """Persist a new full_name value for an existing user (Phase 4 — Profile module)."""
        user.full_name = full_name
        self.db.commit()
        self.db.refresh(user)
        return user