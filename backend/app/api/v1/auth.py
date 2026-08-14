"""Authentication HTTP endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).register(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).login(payload)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).refresh(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    AuthService(db).logout(payload.refresh_token)
    return MessageResponse(detail="Logged out successfully.", code="LOGGED_OUT")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_active_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Send a 6-digit password reset OTP to the provided email address.

    Always returns 200 regardless of whether the email exists —
    this prevents email enumeration attacks.
    """
    AuthService(db).request_password_reset(str(payload.email))
    return MessageResponse(
        detail="If an account with that email exists, a reset code has been sent.",
        code="RESET_CODE_SENT",
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Verify the 6-digit OTP and set a new password.

    Returns 400 if the code is invalid, expired, or already used.
    """
    AuthService(db).confirm_password_reset(
        email=str(payload.email),
        code=payload.code,
        new_password=payload.new_password,
    )
    return MessageResponse(
        detail="Password has been reset successfully. You can now log in.",
        code="PASSWORD_RESET_SUCCESS",
    )