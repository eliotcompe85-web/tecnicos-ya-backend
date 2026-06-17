import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://quick-repair-67.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(api, email, password):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        return None, None
    data = r.json()
    return data["access_token"], data["user"]


@pytest.fixture(scope="session")
def client_auth(api):
    token, user = _login(api, "cliente@test.com", "test123")
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"} if token else {}}


@pytest.fixture(scope="session")
def tech_auth(api):
    token, user = _login(api, "tecnico@test.com", "test123")
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"} if token else {}}
