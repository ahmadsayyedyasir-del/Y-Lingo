"""Shared FastAPI dependencies."""

from collections.abc import Generator
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import InactiveUserError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_app_settings() -> Settings:
    return get_settings()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing or invalid authorization header.")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not subject:
            raise UnauthorizedError("Invalid access token.")
        user_id = UUID(str(subject))
    except (InvalidTokenError, ValueError, TypeError):
        raise UnauthorizedError("Invalid or expired access token.") from None

    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found.")

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise InactiveUserError()

    return current_user