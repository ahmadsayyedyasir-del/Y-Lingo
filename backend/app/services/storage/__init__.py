"""Storage service package — abstraction + concrete backends for file persistence."""

from app.services.storage.base import StorageService

__all__ = ["StorageService"]