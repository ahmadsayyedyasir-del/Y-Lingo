"""Y-Lingo API application entrypoint."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.constants.app import API_DESCRIPTION, API_TITLE, API_VERSION
from app.core.config import get_settings
from app.core.exceptions import YLingoError, ylingo_exception_handler
from app.core.logging import get_logger, setup_logging
from app.middleware.request_id import RequestIdMiddleware

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
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

    application.add_exception_handler(YLingoError, ylingo_exception_handler)

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
        return {
            "message": "Y-Lingo API",
            "status": "running",
            "docs": "/docs",
            "health": "/health",
            "api_v1": settings.api_v1_prefix,
        }

    @application.get("/health", tags=["Health"])
    def health() -> dict:
        return {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.app_env,
        }

    @application.get(settings.api_v1_prefix, tags=["API"])
    def api_v1_root() -> dict:
        return {
            "version": "v1",
            "status": "active",
            "endpoints": {
                "health": f"{settings.api_v1_prefix}/health",
                "register": f"{settings.api_v1_prefix}/auth/register",
                "login": f"{settings.api_v1_prefix}/auth/login",
                "refresh": f"{settings.api_v1_prefix}/auth/refresh",
                "logout": f"{settings.api_v1_prefix}/auth/logout",
                "me": f"{settings.api_v1_prefix}/auth/me",
            },
        }

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    # Avatar files written by LocalStorageService under static/avatars/
    Path("static/avatars").mkdir(parents=True, exist_ok=True)
    application.mount("/static", StaticFiles(directory="static"), name="static")

    return application


app = create_app()