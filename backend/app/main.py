"""Y-Lingo FastAPI Application."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import YLingoError
from app.core.logging import get_logger
from app.middleware.request_id import RequestIdMiddleware

settings = get_settings()
logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter
# In test mode (TESTING=true) rate limiting is disabled so tests don't 429.
# ---------------------------------------------------------------------------
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(
    key_func=get_remote_address,
    enabled=not _testing,
    default_limits=["200/minute"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting Y-Lingo API",
        extra={"env": settings.app_env, "debug": settings.debug},
    )
    yield
    logger.info("Y-Lingo API shutting down")


def create_app() -> FastAPI:
    # Swagger/ReDoc only in non-production
    docs_url    = None if settings.app_env == "production" else "/docs"
    redoc_url   = None if settings.app_env == "production" else "/redoc"
    openapi_url = None if settings.app_env == "production" else "/openapi.json"

    app = FastAPI(
        title="Y-Lingo API",
        description="AI-powered language learning platform",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )

    # ── Rate limiter ──────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── CORS ──────────────────────────────────────────────────────────────────
    raw_origins = settings.cors_origins or "http://localhost:3000"
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-Id"],
    )

    # ── Request ID middleware ─────────────────────────────────────────────────
    app.add_middleware(RequestIdMiddleware)

    # ── Global exception handler ──────────────────────────────────────────────
    @app.exception_handler(YLingoError)
    async def ylingo_error_handler(request: Request, exc: YLingoError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    # ── Static files ──────────────────────────────────────────────────────────
    os.makedirs("static/avatars", exist_ok=True)
    os.makedirs("static/voice", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

    # ── API router ────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # ── Root health ───────────────────────────────────────────────────────────
    @app.get("/")
    def root():
        return {"message": "Y-Lingo API is running", "version": "1.0.0"}

    return app


app = create_app()
