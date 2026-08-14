"""Refresh token persistence."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, user_id: UUID, token: str, expires_at: datetime) -> RefreshToken:
        row = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            revoked=False,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def get_valid(self, token: str) -> RefreshToken | None:
        now = datetime.now(timezone.utc)
        stmt = select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
        return self.db.scalar(stmt)

    def revoke(self, token: str) -> bool:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token == token, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def revoke_all_for_user(self, user_id: UUID) -> int:
        """Support for future logout-all / force-logout."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        result = self.db.execute(stmt)
        return result.rowcount or 0