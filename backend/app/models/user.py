"""User account model — authentication fields only; no auth logic here."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

# Add this import at the top (outside TYPE_CHECKING)
from app.models.rag_document import RAGDocument

if TYPE_CHECKING:
    from app.models.profile import Profile
    from app.models.refresh_token import RefreshToken
    from app.models.user_settings import UserSettings


class User(TimestampMixin, Base):
    """Core identity record for Y-Lingo accounts."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)

    profile: Mapped[Profile | None] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    settings: Mapped[UserSettings | None] = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    rag_documents: Mapped[list[RAGDocument]] = relationship(
        "RAGDocument",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"