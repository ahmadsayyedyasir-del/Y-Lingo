"""Reusable file validation helpers and domain exceptions for uploads.

Validation is intentionally separate from StorageService so any future
upload path (avatars, documents, …) can reuse the same checks without
duplicating rules or leaking storage details.
"""

from __future__ import annotations

from fastapi import UploadFile

from app.core.exceptions import YLingoError

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_IMAGE_MIME_TYPES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    }
)

ALLOWED_IMAGE_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }
)

MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB


# ---------------------------------------------------------------------------
# Domain exceptions (extend existing YLingoError hierarchy)
# ---------------------------------------------------------------------------


class InvalidFileTypeError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Only JPEG, PNG, and WebP images are allowed.",
            code="INVALID_FILE_TYPE",
            status_code=400,
        )


class InvalidFileExtensionError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="File extension must be .jpg, .jpeg, .png, or .webp.",
            code="INVALID_FILE_EXTENSION",
            status_code=400,
        )


class FileTooLargeError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="File size must not exceed 5 MB.",
            code="FILE_TOO_LARGE",
            status_code=400,
        )


class EmptyFileError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Uploaded file is empty.",
            code="EMPTY_FILE",
            status_code=400,
        )


class MissingFilenameError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Uploaded file must have a filename.",
            code="MISSING_FILENAME",
            status_code=400,
        )


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------


def validate_image_upload(file: UploadFile) -> None:
    """
    Validate an image upload against project rules.

    Raises one of the domain exceptions above on failure.
    Does not read the entire stream into memory beyond what is required
    to determine size; the caller remains responsible for rewinding or
    re-reading the stream if needed after validation.
    """
    if not file.filename or not file.filename.strip():
        raise MissingFilenameError()

    extension = _extract_extension(file.filename)
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise InvalidFileExtensionError()

    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise InvalidFileTypeError()

    size = _resolve_size(file)
    if size == 0:
        raise EmptyFileError()
    if size > MAX_IMAGE_SIZE_BYTES:
        raise FileTooLargeError()


def _extract_extension(filename: str) -> str:
    """Return the lowercased extension including the leading dot, or empty string."""
    name = filename.strip()
    if "." not in name:
        return ""
    return "." + name.rsplit(".", maxsplit=1)[-1].lower()


def _resolve_size(file: UploadFile) -> int:
    """
    Determine the uploaded file size in bytes.

    Prefer the SpooledTemporaryFile size when available; otherwise fall
    back to reading the stream and rewinding so downstream code can still
    consume the content.
    """
    underlying = getattr(file, "file", None)
    if underlying is not None and hasattr(underlying, "seek") and hasattr(underlying, "tell"):
        current = underlying.tell()
        underlying.seek(0, 2)  # end
        size = underlying.tell()
        underlying.seek(current)  # restore
        return size

    # Fallback: read once, measure, rewind if possible
    content = file.file.read()
    size = len(content)
    if hasattr(file.file, "seek"):
        file.file.seek(0)
    return size