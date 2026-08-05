"""Health and readiness-style endpoints for v1."""

from fastapi import APIRouter, Depends

from app.api.deps import get_app_settings
from app.core.config import Settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(settings: Settings = Depends(get_app_settings)) -> dict:
    """
    Liveness probe — confirms the API process is up.

    Database and external dependency checks are added in later phases.
    """
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
        "api_version": "v1",
    }