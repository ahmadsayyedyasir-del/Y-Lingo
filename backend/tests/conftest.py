"""Pytest configuration and shared fixtures for Y-Lingo backend tests."""

from __future__ import annotations

import os
import uuid

# ── Set TESTING=true BEFORE any app modules are imported ────────────────────
os.environ.setdefault("TESTING", "true")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.db.session import get_db
from app.main import create_app


def _get_test_db_url() -> str:
    from app.core.config import get_settings
    s = get_settings()
    return os.getenv("TEST_DATABASE_URL", str(s.database_url))


@pytest.fixture(scope="session")
def db_engine():
    url = _get_test_db_url()
    eng = create_engine(url)
    yield eng
    eng.dispose()


@pytest.fixture(scope="function")
def db(db_engine):
    """Fresh DB session per test function."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """Test client with DB session override and rate limiting disabled."""
    # Disable rate limiting during tests via env var
    app = create_app()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Remove the patch context manager wrapping since TESTING env var is set at module level
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


TEST_USER = {
    "full_name": "Test User",
    "username": "testuser",
    "email": "test@ylingo-test.com",
    "password": "TestPass123!",
}


@pytest.fixture()
def registered_user(client: TestClient) -> dict:
    """Register a test user with unique email/username per test."""
    uid = uuid.uuid4().hex[:10]
    user_data = {
        **TEST_USER,
        "username": f"tuser{uid}",
        "email": f"t{uid}@ylingo-test.com",
    }
    resp = client.post("/api/v1/auth/register", json=user_data)
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
def auth_headers(registered_user: dict) -> dict:
    """Return Authorization headers for the registered test user."""
    token = registered_user.get("accessToken") or registered_user.get("access_token")
    assert token, f"No access token in: {registered_user}"
    return {"Authorization": f"Bearer {token}"}
