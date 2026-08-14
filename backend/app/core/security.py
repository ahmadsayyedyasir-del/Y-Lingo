"""Password hashing and JWT helpers."""

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config import get_settings


def hash_password(plain_password: str) -> str:
    """Hash a plain password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain password matches stored hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(*, subject: UUID, extra_claims: dict[str, Any] | None = None) -> str:
    """Create a short-lived access JWT."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate an access token.

    Raises InvalidTokenError on failure.
    """
    settings = get_settings()
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "access":
        raise InvalidTokenError("Invalid token type")
    return payload