"""Foundation endpoint smoke tests."""

from fastapi.testclient import TestClient


def test_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["message"] == "Y-Lingo API"


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_api_v1_root(client: TestClient) -> None:
    response = client.get("/api/v1")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "v1"
    assert data["status"] == "active"


def test_api_v1_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["api_version"] == "v1"


def test_request_id_header(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers