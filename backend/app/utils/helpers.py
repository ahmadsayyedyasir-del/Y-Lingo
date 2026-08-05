"""Generic helpers used across the application."""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)