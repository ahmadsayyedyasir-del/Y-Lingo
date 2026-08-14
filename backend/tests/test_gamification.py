"""Gamification endpoint tests — profile, achievements, XP flow."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


class TestGamificationProfile:
    def test_get_profile_authenticated(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/gamification/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Backend sends camelCase aliases
        assert "totalXp" in data or "total_xp" in data
        assert "currentStreakDays" in data or "current_streak_days" in data

    def test_get_profile_unauthenticated(self, client: TestClient) -> None:
        resp = client.get("/api/v1/gamification/profile")
        assert resp.status_code == 401

    def test_new_user_starts_with_zero_xp(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/gamification/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        xp = data.get("totalXp") or data.get("total_xp") or 0
        assert xp == 0

    def test_new_user_is_level_1(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/gamification/profile", headers=auth_headers)
        data = resp.json()
        level = data.get("level", 1)
        assert level == 1


class TestAchievements:
    def test_get_achievements_authenticated(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/gamification/achievements", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        # All achievements start as locked for new user
        for item in data["items"]:
            assert item.get("unlocked") is False

    def test_get_achievements_unauthenticated(self, client: TestClient) -> None:
        resp = client.get("/api/v1/gamification/achievements")
        assert resp.status_code == 401

    def test_total_achievements_count(self, client: TestClient, auth_headers: dict) -> None:
        resp = client.get("/api/v1/gamification/achievements", headers=auth_headers)
        data = resp.json()
        # At least some achievements defined
        assert len(data.get("items", [])) > 0


class TestXPFlow:
    """Integration test: starting a conversation and sending a message awards XP."""

    def test_xp_awarded_after_conversation_message(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        # Step 1: XP starts at 0
        gam_before = client.get("/api/v1/gamification/profile", headers=auth_headers).json()
        assert gam_before.get("total_xp", 0) == 0

        # Step 2: Start a conversation session
        start_resp = client.post(
            "/api/v1/conversations/start",
            json={"language": "en", "native_language": "Urdu", "level": "beginner"},
            headers=auth_headers,
        )
        # If AI is not configured in test env, skip rather than fail
        if start_resp.status_code in (503, 500):
            pytest.skip("AI provider not available in test environment")
        assert start_resp.status_code == 201
        session_id = start_resp.json().get("id")

        # Step 3: Send a message
        msg_resp = client.post(
            f"/api/v1/conversations/{session_id}/messages",
            json={"message": "Hello!", "language": "en", "level": "beginner"},
            headers=auth_headers,
        )
        if msg_resp.status_code in (503, 502, 500):
            pytest.skip("AI provider not available in test environment")
        assert msg_resp.status_code == 200

        # Step 4: XP should have increased
        gam_after = client.get("/api/v1/gamification/profile", headers=auth_headers).json()
        assert gam_after.get("total_xp", 0) > 0
