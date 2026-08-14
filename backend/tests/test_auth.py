"""Authentication endpoint tests — register, login, /me, refresh, logout."""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient

# All tests that need a fresh user use the registered_user fixture (uuid-based).
# Tests that use fixed emails are idempotent by design (duplicate checks).

WEAK_PASSWORDS = [
    ("short",          "weakuser001"),
    ("alllowercase1!", "weakuser002"),
    ("ALLUPPERCASE1!", "weakuser003"),
    ("NoDigitsHere!",  "weakuser004"),
    ("NoSpecial123",   "weakuser005"),
]


def _fresh_user() -> dict:
    """Return a unique user payload for each call."""
    uid = uuid.uuid4().hex[:10]
    return {
        "full_name": "Auth Tester",
        "username": f"authtester{uid}",
        "email": f"auth{uid}@ylingo-test.com",
        "password": "AuthTest99!",
    }


# ─── Registration ────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/register", json=_fresh_user())
        assert resp.status_code == 201
        data = resp.json()
        assert data.get("accessToken") or data.get("access_token")
        assert data.get("refreshToken") or data.get("refresh_token")
        user = data.get("user") or {}
        assert "@ylingo-test.com" in user.get("email", "")

    def test_register_duplicate_email(self, client: TestClient) -> None:
        payload = _fresh_user()
        client.post("/api/v1/auth/register", json=payload)
        # Second register with same email should fail
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409

    def test_register_duplicate_username(self, client: TestClient) -> None:
        payload = _fresh_user()
        client.post("/api/v1/auth/register", json=payload)
        # Same username, different email
        dup = {**payload, "email": f"dup{uuid.uuid4().hex[:8]}@ylingo-test.com"}
        resp = client.post("/api/v1/auth/register", json=dup)
        assert resp.status_code == 409

    @pytest.mark.parametrize("password,username", WEAK_PASSWORDS)
    def test_register_weak_password(self, client: TestClient, password: str, username: str) -> None:
        payload = {
            **_fresh_user(),
            "password": password,
            "username": username,
        }
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422

    def test_register_missing_fields(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/register", json={"email": "only@ylingo-test.com"})
        assert resp.status_code == 422


# ─── Login ───────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client: TestClient, registered_user: dict) -> None:
        email = (registered_user.get("user") or {}).get("email") or ""
        resp = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "TestPass123!",
        })
        assert resp.status_code == 200
        assert resp.json().get("accessToken") or resp.json().get("access_token")

    def test_login_wrong_password(self, client: TestClient, registered_user: dict) -> None:
        email = (registered_user.get("user") or {}).get("email") or ""
        resp = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "WrongPass999!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/login", json={
            "email": f"nobody{uuid.uuid4().hex[:6]}@ylingo-test.com",
            "password": "AnyPass1!X",
        })
        assert resp.status_code == 401

    def test_login_missing_password(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/login", json={"email": "only@ylingo-test.com"})
        assert resp.status_code == 422


# ─── /me ─────────────────────────────────────────────────────────────────────

class TestMe:
    def test_me_authenticated(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200

    def test_me_unauthenticated(self, client: TestClient) -> None:
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_me_invalid_token(self, client: TestClient) -> None:
        resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


# ─── Refresh ─────────────────────────────────────────────────────────────────

class TestRefresh:
    def test_refresh_success(self, client: TestClient, registered_user: dict) -> None:
        refresh_token = registered_user.get("refreshToken") or registered_user.get("refresh_token")
        resp = client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("accessToken") or data.get("access_token")

    def test_refresh_invalid_token(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/refresh", json={"refreshToken": "invalid-token"})
        assert resp.status_code in (400, 401)

    def test_refresh_missing_token(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/refresh", json={})
        assert resp.status_code == 422


# ─── Logout ──────────────────────────────────────────────────────────────────

class TestLogout:
    def test_logout_success(self, client: TestClient, registered_user: dict, auth_headers: dict) -> None:
        refresh_token = registered_user.get("refreshToken") or registered_user.get("refresh_token")
        resp = client.post(
            "/api/v1/auth/logout",
            json={"refreshToken": refresh_token},
            headers=auth_headers,
        )
        assert resp.status_code == 200

    def test_logout_unauthenticated(self, client: TestClient) -> None:
        resp = client.post("/api/v1/auth/logout", json={"refreshToken": "any"})
        assert resp.status_code == 401
