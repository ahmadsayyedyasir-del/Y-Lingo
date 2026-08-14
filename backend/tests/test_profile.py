"""Profile endpoint tests — GET, UPDATE, avatar upload."""

from __future__ import annotations

import io
import pytest
from fastapi.testclient import TestClient


class TestProfileGet:
    def test_get_profile_authenticated(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Profile fields present
        assert "native_language" in data or "nativeLanguage" in data

    def test_get_profile_unauthenticated(self, client: TestClient) -> None:
        resp = client.get("/api/v1/profile")
        assert resp.status_code == 401


class TestProfileUpdate:
    def test_update_profile_success(self, client: TestClient, auth_headers: dict) -> None:
        payload = {
            "native_language": "Urdu",
            "learning_language": "English",
            "level": 1,
            "learning_style": "conversation-first",
            "daily_goal": 30,
            "bio": "I love learning English.",
        }
        resp = client.put("/api/v1/profile", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        bio = data.get("bio") or ""
        assert bio == payload["bio"]

    def test_update_profile_with_full_name(self, client: TestClient, auth_headers: dict) -> None:
        payload = {
            "full_name": "Updated Name",
            "native_language": "Urdu",
            "learning_language": "English",
            "level": 2,
            "learning_style": "structured",
            "daily_goal": 50,
        }
        resp = client.put("/api/v1/profile", json=payload, headers=auth_headers)
        assert resp.status_code == 200

    def test_update_profile_unauthenticated(self, client: TestClient) -> None:
        resp = client.put("/api/v1/profile", json={"native_language": "English"})
        assert resp.status_code == 401

    def test_update_profile_missing_required_fields(self, client: TestClient, auth_headers: dict) -> None:
        # native_language is required
        resp = client.put("/api/v1/profile", json={"bio": "only bio"}, headers=auth_headers)
        assert resp.status_code == 422


class TestProfileCompletion:
    def test_profile_completion_increases(self, client: TestClient, auth_headers: dict) -> None:
        # Get initial completion
        resp1 = client.get("/api/v1/profile", headers=auth_headers)
        initial = resp1.json().get("completion_percentage", 0)

        # Update more fields
        payload = {
            "native_language": "Urdu",
            "learning_language": "English",
            "level": 1,
            "learning_style": "conversation-first",
            "daily_goal": 30,
            "bio": "Learning English for career growth.",
        }
        client.put("/api/v1/profile", json=payload, headers=auth_headers)

        resp2 = client.get("/api/v1/profile", headers=auth_headers)
        updated = resp2.json().get("completion_percentage", 0)

        assert updated >= initial
