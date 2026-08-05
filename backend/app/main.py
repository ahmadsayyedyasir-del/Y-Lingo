"""Y-Lingo API application entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.constants.app import API_DESCRIPTION, API_TITLE, API_VERSION
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.middleware.request_id import RequestIdMiddleware

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application startup and shutdown hooks."""
    settings = get_settings()
    logger.info(
        "Starting %s | env=%s | debug=%s",
        settings.app_name,
        settings.app_env,
        settings.debug,
    )
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    """Application factory — explicit and testable."""
    settings = get_settings()

    application = FastAPI(
        title=API_TITLE,
        description=API_DESCRIPTION,
        version=API_VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestIdMiddleware)

    @application.get("/", tags=["Root"])
    def root() -> dict:
        """Root landing — confirms the process is reachable."""
        return {
            "message": "Y-Lingo API",
            "status": "running",
            "docs": "/docs",
            "health": "/health",
            "api_v1": settings.api_v1_prefix,
        }

    @application.get("/health", tags=["Health"])
    def health() -> dict:
        """Top-level liveness probe (platform-friendly path)."""
        return {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.app_env,
        }

    @application.get(settings.api_v1_prefix, tags=["API"])
    def api_v1_root() -> dict:
        """Versioned API root for this phase."""
        return {
            "version": "v1",
            "status": "active",
            "endpoints": {
                "health": f"{settings.api_v1_prefix}/health",
            },
        }

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()