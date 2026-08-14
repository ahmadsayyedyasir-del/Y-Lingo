"""Authentication use-cases."""

import random
import secrets
import string
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import (
    EmailAlreadyExistsError,
    EmailNotFoundError,
    EmailServiceError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    InvalidResetCodeError,
    UsernameAlreadyExistsError,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.password_reset_code import PasswordResetCode
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.email_service import get_email_service


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.settings = get_settings()

    def register(self, payload: RegisterRequest) -> TokenResponse:
        if self.users.get_by_email(str(payload.email)):
            raise EmailAlreadyExistsError()
        if self.users.get_by_username(payload.username):
            raise UsernameAlreadyExistsError()

        try:
            user = self.users.create_user_with_defaults(
                full_name=payload.full_name,
                username=payload.username,
                email=str(payload.email),
                hashed_password=hash_password(payload.password),
            )
            tokens = self._issue_tokens(user)
            self.db.commit()
            self.db.refresh(user)
            return tokens
        except Exception:
            self.db.rollback()
            raise

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(str(payload.email))
        if user is None or not verify_password(payload.password, user.hashed_password):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InactiveUserError()

        try:
            tokens = self._issue_tokens(user)
            self.db.commit()
            return tokens
        except Exception:
            self.db.rollback()
            raise

    def refresh(self, raw_refresh_token: str) -> TokenResponse:
        stored = self.refresh_tokens.get_valid(raw_refresh_token)
        if stored is None:
            raise InvalidRefreshTokenError()

        user = self.users.get_by_id(stored.user_id)
        if user is None or not user.is_active:
            raise InvalidRefreshTokenError()

        try:
            self.refresh_tokens.revoke(raw_refresh_token)
            tokens = self._issue_tokens(user)
            self.db.commit()
            return tokens
        except Exception:
            self.db.rollback()
            raise

    def logout(self, raw_refresh_token: str) -> None:
        try:
            self.refresh_tokens.revoke(raw_refresh_token)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def get_user_response(self, user: User) -> UserResponse:
        return UserResponse.model_validate(user)

    # ------------------------------------------------------------------
    # Password Reset
    # ------------------------------------------------------------------

    def request_password_reset(self, email: str) -> None:
        """
        Generate a 6-digit OTP and send it to the user's email.

        Always returns silently even if the email does not exist —
        this prevents email enumeration. The endpoint returns 200 regardless.
        """
        user = self.users.get_by_email(email)
        if user is None or not user.is_active:
            # Silent success — do not reveal whether email is registered
            return

        # Invalidate any previously issued unexpired codes for this user
        self.db.query(PasswordResetCode).filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.is_used == False,  # noqa: E712
        ).update({"is_used": True})

        # Generate a cryptographically random 6-digit code
        otp = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.password_reset_code_expire_minutes
        )

        reset_code = PasswordResetCode(
            id=uuid4(),
            user_id=user.id,
            code=otp,
            is_used=False,
            expires_at=expires_at,
        )
        self.db.add(reset_code)

        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        # Send email — if it fails, raise EmailServiceError so the user knows
        try:
            email_svc = get_email_service()
            email_svc.send_password_reset_otp(
                to_email=user.email,
                to_name=user.full_name,
                otp_code=otp,
            )
        except RuntimeError as exc:
            raise EmailServiceError(str(exc)) from exc

    def confirm_password_reset(
        self,
        email: str,
        code: str,
        new_password: str,
    ) -> None:
        """
        Verify the OTP and set a new password.

        Raises InvalidResetCodeError if the code is wrong, expired, or used.
        """
        user = self.users.get_by_email(email)
        if user is None or not user.is_active:
            raise InvalidResetCodeError()

        now = datetime.now(timezone.utc)

        # Find a valid, unused, non-expired code for this user
        reset_code = (
            self.db.query(PasswordResetCode)
            .filter(
                PasswordResetCode.user_id == user.id,
                PasswordResetCode.code == code,
                PasswordResetCode.is_used == False,  # noqa: E712
                PasswordResetCode.expires_at > now,
            )
            .first()
        )

        if reset_code is None:
            raise InvalidResetCodeError()

        # Mark the code as used
        reset_code.is_used = True

        # Update the user's password
        user.hashed_password = hash_password(new_password)

        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _issue_tokens(self, user: User) -> TokenResponse:
        access = create_access_token(subject=user.id)
        refresh = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(days=self.settings.refresh_token_expire_days)
        self.refresh_tokens.create(user_id=user.id, token=refresh, expires_at=expires_at)
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )