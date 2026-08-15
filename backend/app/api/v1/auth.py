"""Authentication HTTP endpoints."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _make_limiter() -> Limiter:
    import os
    if os.environ.get("TESTING", "").lower() in ("1", "true", "yes"):
        return Limiter(key_func=get_remote_address, enabled=False, default_limits=["100000/minute"])
    return Limiter(key_func=get_remote_address)

limiter = _make_limiter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).register(payload)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).login(payload)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
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
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    AuthService(db).request_password_reset(str(payload.email))
    return MessageResponse(
        detail="If an account with that email exists, a reset code has been sent.",
        code="RESET_CODE_SENT",
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    AuthService(db).confirm_password_reset(
        email=str(payload.email),
        code=payload.code,
        new_password=payload.new_password,
    )
    return MessageResponse(
        detail="Password has been reset successfully. You can now log in.",
        code="PASSWORD_RESET_SUCCESS",
    )


# ── Email Verification ────────────────────────────────────────────────────────

@router.post("/verify-email", response_model=MessageResponse)
@limiter.limit("10/minute")
def verify_email(
    request: Request,
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Verify email address using the 6-digit OTP sent after registration."""
    AuthService(db).verify_email(email=str(payload.email), code=payload.code)
    return MessageResponse(
        detail="Email verified successfully. You can now log in.",
        code="EMAIL_VERIFIED",
    )


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
def resend_verification(
    request: Request,
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Resend email verification OTP. Always returns 200 (no enumeration)."""
    AuthService(db).resend_verification_email(email=str(payload.email))
    return MessageResponse(
        detail="If an account with that email exists and is unverified, a new code has been sent.",
        code="VERIFICATION_SENT",
    )