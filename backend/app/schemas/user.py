"""Public user representation — never includes password hashes."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    """Safe user payload for API responses."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    full_name: str = Field(serialization_alias="fullName")
    username: str
    email: EmailStr
    is_active: bool = Field(serialization_alias="isActive")
    is_verified: bool = Field(serialization_alias="isVerified")
    created_at: datetime = Field(serialization_alias="createdAt")


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(..., min_length=1, max_length=150, serialization_alias="fullName")
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full name is required")
        return v.strip()

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Username is required")
        if not v.isalnum() and not all(c.isalnum() or c == "_" for c in v):
            raise ValueError("Username may only contain letters, numbers, and underscores")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must include an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must include a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must include a number")
        return v


class LoginRequest(BaseModel):
    """Request schema for login."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Response schema for login."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="bearer")
    user: UserResponse


class RefreshRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str = Field(..., serialization_alias="refreshToken")


class RefreshResponse(BaseModel):
    """Response schema for token refresh."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")


class PasswordChangeRequest(BaseModel):
    """Request schema for password change."""

    model_config = ConfigDict(populate_by_name=True)

    current_password: str = Field(..., serialization_alias="currentPassword")
    new_password: str = Field(..., min_length=8, serialization_alias="newPassword")
    confirm_password: str = Field(..., serialization_alias="confirmPassword")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must include an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must include a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must include a number")
        return v

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return 