"""Health check endpoint tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_root(client: TestClient) -> None:
    """Root endpoint returns 200."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "Y-Lingo" in data.get("message", "")


def test_health(client: TestClient) -> None:
    """/api/v1/health returns 200."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_api_v1_health(client: TestClient) -> None:
    """/api/v1/health returns 200 (alias)."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_request_id_header(client: TestClient) -> None:
    """Every response includes X-Request-Id header."""
    resp = client.get("/api/v1/health")
    assert "x-request-id" in resp.headers or "X-Request-Id" in resp.headers
