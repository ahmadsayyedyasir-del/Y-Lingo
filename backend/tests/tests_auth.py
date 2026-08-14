"""Authentication flow smoke tests (requires DB)."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())


def _unique_user(suffix: str) -> dict:
    return {
        "fullName": "Test User",
        "username": f"user_{suffix}",
        "email": f"user_{suffix}@example.com",
        "password": "Str0ng!Pass",
    }


@pytest.mark.integration
def test_register_login_me_logout(client: TestClient) -> None:
    payload = _unique_user("auth1")
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    body = reg.json()
    assert "accessToken" in body
    assert "refreshToken" in body
    assert body["user"]["email"] == payload["email"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.json()["username"] == payload["username"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200
    login_body = login.json()

    logout = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": login_body["refreshToken"]},
        headers={"Authorization": f"Bearer {login_body['accessToken']}"},
    )
    assert logout.status_code == 200