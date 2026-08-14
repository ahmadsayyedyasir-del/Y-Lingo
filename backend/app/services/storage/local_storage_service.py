"""Local filesystem implementation of StorageService — used until Cloudinary/S3 is introduced."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import UploadFile

from app.services.storage.base import StorageService

_DEFAULT_SUBDIRECTORY = "avatars"
_DEFAULT_EXTENSION = ".jpg"


class LocalStorageService(StorageService):
    """
    Saves uploaded files to a local directory and serves them via a public
    URL prefix.

    File-type and size validation are intentionally NOT this class's
    responsibility — it persists whatever file it is given and returns a
    public URL. Validation belongs to a dedicated step before save() is
    called. This keeps the class swappable for a Cloudinary/S3
    implementation without any change to its callers.
    """

    def __init__(self, base_directory: str = "static", public_url_prefix: str = "/static") -> None:
        """
        Args:
            base_directory: Filesystem root where uploaded files are written.
            public_url_prefix: URL prefix under which `base_directory` is
                served (e.g. via FastAPI's StaticFiles mount).
        """
        self._base_directory = Path(base_directory)
        self._public_url_prefix = public_url_prefix.rstrip("/")

    def save(
        self,
        file: UploadFile,
        *,
        filename_prefix: str,
        subdirectory: str = _DEFAULT_SUBDIRECTORY,
    ) -> str:
        """
        Write the uploaded file under `subdirectory` and return its public URL.

        `subdirectory` defaults to "avatars" — existing avatar-upload callers
        that don't pass it keep working exactly as before.
        """
        target_directory = self._base_directory / subdirectory
        target_directory.mkdir(parents=True, exist_ok=True)

        extension = self._resolve_extension(file.filename)
        unique_filename = f"{filename_prefix}_{uuid.uuid4().hex}{extension}"
        destination = target_directory / unique_filename

        with destination.open("wb") as buffer:
            buffer.write(file.file.read())

        return f"{self._public_url_prefix}/{subdirectory}/{unique_filename}"

    def delete(self, file_url: str) -> None:
        """
        Remove a previously saved file.

        Only deletes files that resolve inside `base_directory`. Safe to call
        when the file is already missing or the URL is invalid. Infers the
        subdirectory from the URL itself, so this now works for avatars,
        voice audio, or any future subdirectory without another signature
        change.
        """
        if not file_url:
            return

        relative = self._relative_path_from_url(file_url)
        if relative is None:
            return

        target = (self._base_directory / relative).resolve()
        try:
            target.relative_to(self._base_directory.resolve())
        except ValueError:
            # Resolved path escaped the base directory — refuse to delete.
            return

        target.unlink(missing_ok=True)

    def _relative_path_from_url(self, file_url: str) -> Path | None:
        """Extract the `<subdirectory>/<filename>` portion of a public URL."""
        prefix = f"{self._public_url_prefix}/"
        if file_url.startswith(prefix):
            relative = file_url[len(prefix):]
        else:
            # Defensive fallback for a bare/legacy filename — preserves the
            # original (avatars-only) delete behavior for old-style URLs.
            filename = Path(file_url).name
            if not filename or filename in {".", ".."}:
                return None
            relative = f"{_DEFAULT_SUBDIRECTORY}/{filename}"

        relative_path = Path(relative)
        if ".." in relative_path.parts:
            return None
        return relative_path

    @staticmethod
    def _resolve_extension(original_filename: str | None) -> str:
        """Extract the file extension from the original filename, defaulting if absent."""
        if not original_filename:
            return _DEFAULT_EXTENSION

        extension = Path(original_filename).suffix.lower()
        return extension or _DEFAULT_EXTENSION