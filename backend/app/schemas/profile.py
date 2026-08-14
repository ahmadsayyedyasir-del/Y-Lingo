"""Pydantic schemas for the Profile API (Phase 4 + completion fields)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ProfileResponse(BaseModel):
    """Full profile payload. full_name/username/email come from User; the rest from Profile."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    full_name: str
    username: str
    email: str
    bio: str | None = None
    avatar_url: str | None = None
    native_language: str
    learning_language: str
    level: int
    learning_style: str
    daily_goal: int

    profile_completion: int = Field(..., ge=0, le=100)
    is_profile_complete: bool


class ProfileUpdateRequest(BaseModel):
    """
    Editable profile fields.

    full_name is optional — if omitted the user's name is not changed.
    avatar_url is intentionally excluded — set only via POST /profile/avatar.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    bio: str | None = None
    native_language: str = Field(..., max_length=50)
    learning_language: str = Field(..., max_length=50)
    learning_style: str = Field(..., max_length=50)
    daily_goal: int = Field(..., ge=0)