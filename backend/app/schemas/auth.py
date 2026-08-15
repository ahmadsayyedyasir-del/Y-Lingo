"""Authentication request and response schemas."""

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.user import UserResponse

_PASSWORD_SPECIAL = re.compile(r"[^A-Za-z0-9]")


class RegisterRequest(BaseModel):
    """Matches frontend Signup form fields (camelCase accepted)."""

    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(..., min_length=2, max_length=150, alias="fullName")
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Enter your full name.")
        return cleaned

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        cleaned = value.strip()
        if not re.fullmatch(r"[A-Za-z0-9_]+", cleaned):
            raise ValueError("Username may only contain letters, numbers, and underscores.")
        return cleaned.lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include an uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include a lowercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must include a number.")
        if not _PASSWORD_SPECIAL.search(value):
            raise ValueError("Password must include a special character.")
        return value


class LoginRequest(BaseModel):
    """Matches frontend Login form."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """Tokens plus safe user — used after register and login."""

    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")
    user: UserResponse


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(..., min_length=10, alias="refreshToken")


class LogoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(..., min_length=10, alias="refreshToken")


class MessageResponse(BaseModel):
    detail: str
    code: str = "OK"


# ============================================================
# Password Reset Schemas
# ============================================================

class ForgotPasswordRequest(BaseModel):
    """Request to send a password reset OTP to the user's email."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Verify OTP code and set a new password."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include an uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include a lowercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must include a number.")
        if not _PASSWORD_SPECIAL.search(value):
            raise ValueError("Password must include a special character.")
        return value


class VerifyEmailRequest(BaseModel):
    """Verify email address with 6-digit OTP."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResendVerificationRequest(BaseModel):
    """Request a new verification email."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr