"""Structured logging configuration."""

import logging
import sys
from typing import Optional

from app.core.config import get_settings


def setup_logging(level: Optional[str] = None) -> None:
    """Configure root logger for the application process."""
    settings = get_settings()
    log_level = (level or settings.log_level).upper()

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    # Reduce noise from third-party libraries in production-like runs
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger for modules."""
    return logging.getLogger(name)