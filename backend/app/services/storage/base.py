"""Abstract storage service — defines the contract for saving and deleting uploaded files.

Concrete implementations (local filesystem, Cloudinary, S3, ...) must not leak
their storage-specific details into any service that depends on this abstraction.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from fastapi import UploadFile


class StorageService(ABC):
    """Contract every storage backend must implement."""

    @abstractmethod
    def save(self, file: UploadFile, *, filename_prefix: str, subdirectory: str = "avatars") -> str:
        """
        Persist an uploaded file and return its public URL (or path).

        Args:
            file: The incoming multipart file.
            filename_prefix: A caller-supplied prefix (e.g. the user id) used
                to build a unique, collision-free filename.
            subdirectory: Logical folder to store the file under (e.g.
                "avatars", "voice"). Defaults to "avatars" so every caller
                written before this parameter existed keeps working with zero
                code changes.

        Returns:
            The public URL or path that can be stored on the owning record
            (e.g. Profile.avatar_url) and served back to the client.
        """
        raise NotImplementedError

    @abstractmethod
    def delete(self, file_url: str) -> None:
        """
        Remove a previously saved file, given the URL/path returned by save().

        Must be safe to call with a URL that no longer exists on disk or in
        remote storage — implementations should not raise if the file is
        already gone.
        """
        raise NotImplementedError