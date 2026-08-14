"""

Mirrors app/core/file_validation.py's pattern for images — kept as a separate
module so audio-specific rules never leak into or get confused with image
validation.
"""

from __future__ import annotations

from fastapi import UploadFile

from app.core.exceptions import YLingoError
from app.core.voice_settings import get_voice_settings

ALLOWED_AUDIO_MIME_TYPES: frozenset[str] = frozenset(
    {
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/ogg",
        "audio/m4a",
        "audio/mp4",
        "audio/x-m4a",
    }
)

ALLOWED_AUDIO_EXTENSIONS: frozenset[str] = frozenset(
    {".mp3", ".wav", ".webm", ".ogg", ".m4a", ".mp4"}
)


class InvalidAudioTypeError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Only MP3, WAV, WebM, OGG, and M4A audio files are allowed.",
            code="INVALID_AUDIO_TYPE",
            status_code=400,
        )


class InvalidAudioExtensionError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="File extension must be .mp3, .wav, .webm, .ogg, or .m4a.",
            code="INVALID_AUDIO_EXTENSION",
            status_code=400,
        )


class AudioTooLargeError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Audio file size exceeds the allowed limit.",
            code="AUDIO_TOO_LARGE",
            status_code=400,
        )


class EmptyAudioFileError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Uploaded audio file is empty.",
            code="EMPTY_AUDIO_FILE",
            status_code=400,
        )


class MissingAudioFilenameError(YLingoError):
    def __init__(self) -> None:
        super().__init__(
            message="Uploaded audio file must have a filename.",
            code="MISSING_AUDIO_FILENAME",
            status_code=400,
        )


def validate_audio_upload(file: UploadFile) -> None:
    """Validate an audio upload against project rules. Raises a domain exception on failure."""
    if not file.filename or not file.filename.strip():
        raise MissingAudioFilenameError()

    extension = _extract_extension(file.filename)
    if extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise InvalidAudioExtensionError()

    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_AUDIO_MIME_TYPES:
        raise InvalidAudioTypeError()

    size = _resolve_size(file)
    if size == 0:
        raise EmptyAudioFileError()
    if size > get_voice_settings().max_audio_size_bytes:
        raise AudioTooLargeError()


def _extract_extension(filename: str) -> str:
    name = filename.strip()
    if "." not in name:
        return ""
    return "." + name.rsplit(".", maxsplit=1)[-1].lower()


def _resolve_size(file: UploadFile) -> int:
    underlying = getattr(file, "file", None)
    if underlying is not None and hasattr(underlying, "seek") and hasattr(underlying, "tell"):
        current = underlying.tell()
        underlying.seek(0, 2)
        size = underlying.tell()
        underlying.seek(current)
        return size

    content = file.file.read()
    size = len(content)
    if hasattr(file.file, "seek"):
        file.file.seek(0)
    return size