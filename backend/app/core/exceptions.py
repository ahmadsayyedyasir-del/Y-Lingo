"""Application-level exceptions and HTTP mapping helpers."""

from fastapi import Request
from fastapi.responses import JSONResponse


class YLingoError(Exception):
    """Base application error with stable machine-readable code."""

    def __init__(self, message: str, code: str = "YLINGO_ERROR", status_code: int = 400) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class EmailAlreadyExistsError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="An account with this email already exists.",
            code="EMAIL_ALREADY_EXISTS",
            status_code=409,
        )


class UsernameAlreadyExistsError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="This username is already taken.",
            code="USERNAME_ALREADY_EXISTS",
            status_code=409,
        )


class InvalidCredentialsError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Invalid email or password.",
            code="INVALID_CREDENTIALS",
            status_code=401,
        )


class InactiveUserError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="This account is inactive.",
            code="USER_INACTIVE",
            status_code=403,
        )


class UnauthorizedError(YLingoError):
    def __init__(self, message: str = "Not authenticated.") -> None:
        super().__init__(message=message, code="UNAUTHORIZED", status_code=401)


class InvalidRefreshTokenError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Invalid or expired refresh token.",
            code="INVALID_REFRESH_TOKEN",
            status_code=401,
        )


class ProfileNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Profile not found.",
            code="PROFILE_NOT_FOUND",
            status_code=404,
        )


class ConversationSessionNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Conversation session not found.",
            code="CONVERSATION_SESSION_NOT_FOUND",
            status_code=404,
        )


class ConversationSessionNotActiveError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Conversation session is not active.",
            code="CONVERSATION_SESSION_NOT_ACTIVE",
            status_code=400,
        )


class InvalidMessageContentError(YLingoError):
    def __init__(self, message: str = "Message content is invalid.") -> None:
        super().__init__(
            message=message,
            code="INVALID_MESSAGE_CONTENT",
            status_code=400,
        )


class AIConfigurationError(YLingoError):
    def __init__(self, message: str = "AI provider is not configured.") -> None:
        super().__init__(
            message=message,
            code="AI_CONFIGURATION_ERROR",
            status_code=503,
        )


class AIProviderError(YLingoError):
    def __init__(self, message: str = "The AI coach could not generate a reply. Please try again.") -> None:
        super().__init__(
            message=message,
            code="AI_PROVIDER_ERROR",
            status_code=502,
        )


class MessageFeedbackNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Coaching feedback for this message is not available.",
            code="MESSAGE_FEEDBACK_NOT_FOUND",
            status_code=404,
        )


class MessageAudioNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Audio for this message is not available.",
            code="MESSAGE_AUDIO_NOT_FOUND",
            status_code=404,
        )


class CurriculumNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Curriculum not found.",
            code="CURRICULUM_NOT_FOUND",
            status_code=404,
        )


class UnitNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Unit not found.",
            code="UNIT_NOT_FOUND",
            status_code=404,
        )


class LessonNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Lesson not found.",
            code="LESSON_NOT_FOUND",
            status_code=404,
        )


class ExerciseNotFoundError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Exercise not found.",
            code="EXERCISE_NOT_FOUND",
            status_code=404,
        )


class LessonNotStartedError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="You must start this lesson before submitting answers or completing it.",
            code="LESSON_NOT_STARTED",
            status_code=400,
        )


class AdminAccessRequiredError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Admin access is required for this action.",
            code="ADMIN_ACCESS_REQUIRED",
            status_code=403,
        )


class InvalidExerciseContentError(YLingoError):
    def __init__(self, message: str = "Exercise content is invalid for this exercise type.") -> None:
        super().__init__(
            message=message,
            code="INVALID_EXERCISE_CONTENT",
            status_code=400,
        )


class DuplicateOrderIndexError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="An item with this order index already exists in the same parent.",
            code="DUPLICATE_ORDER_INDEX",
            status_code=409,
        )


class ContentInUseError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="This content cannot be deleted because learners have progress on it. Unpublish it instead.",
            code="CONTENT_IN_USE",
            status_code=409,
        )


# ============================================================
# RAG Exceptions (Added for Phase 12)
# ============================================================

class InvalidFileError(YLingoError):
    """Raised when a file is invalid (wrong format, too large, etc.)."""
    def __init__(self, message: str = "Invalid file.") -> None:
        super().__init__(
            message=message,
            code="INVALID_FILE",
            status_code=400,
        )


class RAGConfigurationError(YLingoError):
    """Raised when RAG service is misconfigured."""
    def __init__(self, message: str = "RAG service is not configured properly.") -> None:
        super().__init__(
            message=message,
            code="RAG_CONFIGURATION_ERROR",
            status_code=503,
        )


# ============================================================
# Password Reset Exceptions
# ============================================================

class InvalidResetCodeError(YLingoError):
    """Raised when OTP code is wrong, expired, or already used."""
    def __init__(self) -> None:
        super().__init__(
            message="The verification code is invalid or has expired.",
            code="INVALID_RESET_CODE",
            status_code=400,
        )


class EmailNotFoundError(YLingoError):
    """Raised when no account exists for the given email on password reset request.
    Note: in production you may want to silently succeed to avoid email enumeration.
    This exception is available for internal use; the endpoint returns 200 regardless."""
    def __init__(self) -> None:
        super().__init__(
            message="No account found with this email address.",
            code="EMAIL_NOT_FOUND",
            status_code=404,
        )


class EmailServiceError(YLingoError):
    """Raised when the SMTP email send fails."""
    def __init__(self, message: str = "Failed to send email. Please try again later.") -> None:
        super().__init__(
            message=message,
            code="EMAIL_SERVICE_ERROR",
            status_code=503,
        )


class EmailNotVerifiedError(YLingoError):
    """Raised when user tries to login without verifying their email."""
    def __init__(self) -> None:
        super().__init__(
            message="Please verify your email address before logging in. Check your inbox for the verification code.",
            code="EMAIL_NOT_VERIFIED",
            status_code=403,
        )


async def ylingo_exception_handler(_request: Request, exc: YLingoError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )