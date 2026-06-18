"""Backend tests for Técnicos Ya marketplace API.
Covers: auth, categories, technician profile, service requests, applications, visits, reviews (privacy).
"""
import os
import time
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")


# ==================== AUTH ====================
class TestAuth:
    def test_register_client(self):
        unique = int(time.time() * 1000)
        payload = {
            "email": f"TEST_client_{unique}@example.com",
            "password": "test1234",
            "full_name": "Test Client",
            "phone": "+56911111111",
            "role": "client",
        }
        r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "client"

    def test_register_technician_creates_profile(self):
        unique = int(time.time() * 1000)
        payload = {
            "email": f"TEST_tech_{unique}@example.com",
            "password": "test1234",
            "full_name": "Test Tech",
            "phone": "+56922222222",
            "role": "technician",
        }
        r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r.status_code == 200, r.text
        # is_first_month_free flag implicit via membership endpoint later; here we only assert registration
        assert r.json()["user"]["role"] == "technician"

    def test_register_duplicate_email(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "cliente@test.com", "password": "test123",
            "full_name": "Dup", "phone": "+56900", "role": "client"
        })
        assert r.status_code == 400

    def test_register_short_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "TEST_short@example.com", "password": "123",
            "full_name": "Short", "phone": "+56900", "role": "client"
        })
        assert r.status_code == 400

    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "cliente@test.com", "password": "test123"})
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()
        assert r.json()["user"]["role"] == "client"

    def test_login_case_insensitive_email(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "CLIENTE@TEST.COM", "password": "test123"})
        assert r.status_code == 200, r.text

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "cliente@test.com", "password": "wrong"})
        assert r.status_code == 401

    def test_auth_me_returns_current_user(self):
        login = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": "cliente@test.com", "password": "test123"}).json()
        token = login["access_token"]
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, f"Expected 200 but got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("email") == "cliente@test.com"
        assert body.get("role") == "client"

    def test_auth_me_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code in (401, 403)


# ==================== CATEGORIES ====================
class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{BASE_URL}/api/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) > 0
        names = {c["name"] for c in cats}
        assert "Electricos" in names
        assert "Mecanicos" in names
        assert "Gasfiter" in names
        # Required fields
        for c in cats:
            assert "_id" in c and "name" in c


# ==================== HELPERS ====================
def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    d = r.json()
    return d["access_token"], d["user"], {"Authorization": f"Bearer {d['access_token']}"}


# ==================== TECHNICIAN PROFILE ====================
class TestTechnicianProfile:
    def test_search_technicians_no_filter(self):
        r = requests.get(f"{BASE_URL}/api/technicians/search")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_profile_as_technician(self):
        _, _, h = _login("tecnico@test.com", "test123")
        # Get a category id
        cat = requests.get(f"{BASE_URL}/api/categories").json()[0]
        payload = {
            "category_ids": [cat["_id"]],
            "description": "Técnico de prueba",
            "experience_years": 5,
            "availability_status": "available",
            "location": {"type": "Point", "coordinates": [-70.6483, -33.4569]},
        }
        r = requests.put(f"{BASE_URL}/api/technicians/profile", headers=h, json=payload)
        assert r.status_code == 200, r.text

    def test_update_profile_as_client_forbidden(self):
        _, _, h = _login("cliente@test.com", "test123")
        r = requests.put(f"{BASE_URL}/api/technicians/profile", headers=h,
                         json={"description": "should fail"})
        assert r.status_code == 403

    def test_get_technician_profile(self):
        _, tech_user, _ = _login("tecnico@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/technicians/profile/{tech_user['_id']}")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("user_id") == tech_user["_id"]
        assert "reviews" in body


# ==================== SERVICE REQUESTS ====================
class TestServiceRequests:
    def test_create_service_request_as_client(self):
        _, client_user, h = _login("cliente@test.com", "test123")
        cat = requests.get(f"{BASE_URL}/api/categories").json()[0]
        payload = {
            "client_id": client_user["_id"],
            "category_id": cat["_id"],
            "title": "TEST Necesito electricista",
            "description": "Test description",
            "location": {"type": "Point", "coordinates": [-70.6483, -33.4569]},
            "address": "Av. Test 123, Santiago",
            "status": "open",
            "budget_max": 50000,
        }
        r = requests.post(f"{BASE_URL}/api/service-requests", headers=h, json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "open"
        assert "_id" in body

    def test_create_service_request_as_technician_forbidden(self):
        _, tech_user, h = _login("tecnico@test.com", "test123")
        cat = requests.get(f"{BASE_URL}/api/categories").json()[0]
        payload = {
            "client_id": tech_user["_id"],
            "category_id": cat["_id"],
            "title": "Test",
            "description": "x",
            "location": {"type": "Point", "coordinates": [-70.6, -33.4]},
            "address": "x",
        }
        r = requests.post(f"{BASE_URL}/api/service-requests", headers=h, json=payload)
        assert r.status_code == 403

    def test_list_service_requests_authenticated(self):
        _, _, h = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/service-requests", headers=h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ==================== APPLICATIONS ====================
class TestApplications:
    def test_create_application_as_client_forbidden(self):
        _, _, h = _login("cliente@test.com", "test123")
        r = requests.post(f"{BASE_URL}/api/applications", headers=h, json={
            "service_request_id": "fake_id",
            "technician_id": "x",
            "message": "hi",
            "proposed_price": 10000,
        })
        assert r.status_code == 403

    def test_create_application_as_technician_with_membership(self):
        # Create a service request first
        _, client_user, h_client = _login("cliente@test.com", "test123")
        cat = requests.get(f"{BASE_URL}/api/categories").json()[0]
        req_payload = {
            "client_id": client_user["_id"],
            "category_id": cat["_id"],
            "title": "TEST app",
            "description": "x",
            "location": {"type": "Point", "coordinates": [-70.6, -33.4]},
            "address": "addr",
        }
        req_r = requests.post(f"{BASE_URL}/api/service-requests", headers=h_client, json=req_payload)
        assert req_r.status_code == 200, req_r.text
        sr_id = req_r.json()["_id"]

        _, tech_user, h_tech = _login("tecnico@test.com", "test123")
        app_payload = {
            "service_request_id": sr_id,
            "technician_id": tech_user["_id"],
            "message": "Yo puedo",
            "proposed_price": 15000,
        }
        r = requests.post(f"{BASE_URL}/api/applications", headers=h_tech, json=app_payload)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "pending"

    def test_my_applications_as_technician(self):
        _, _, h = _login("tecnico@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/applications/my-applications", headers=h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ==================== REVIEWS PRIVACY ====================
class TestReviewsPrivacy:
    def test_client_can_view_technician_reviews(self):
        _, tech_user, _ = _login("tecnico@test.com", "test123")
        _, _, h_client = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/reviews/user/{tech_user['_id']}", headers=h_client)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "reviews" in body

    def test_technician_can_view_client_reviews(self):
        _, client_user, _ = _login("cliente@test.com", "test123")
        _, _, h_tech = _login("tecnico@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/reviews/user/{client_user['_id']}", headers=h_tech)
        assert r.status_code == 200, r.text

    def test_client_cannot_view_other_client_reviews(self):
        # Register new test client
        unique = int(time.time() * 1000)
        reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_priv_{unique}@example.com",
            "password": "test1234",
            "full_name": "Other Client",
            "phone": "+56933333333",
            "role": "client",
        }).json()
        other_id = reg["user"]["_id"]

        _, _, h_client = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/reviews/user/{other_id}", headers=h_client)
        assert r.status_code == 403, f"Expected 403 but got {r.status_code}: {r.text}"

    def test_user_can_view_own_reviews(self):
        _, client_user, h = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/reviews/user/{client_user['_id']}", headers=h)
        assert r.status_code == 200, r.text

    def test_pending_reviews(self):
        _, _, h = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/reviews/pending", headers=h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ==================== PRICE CALCULATION ====================
class TestPriceCalculation:
    def test_base_price_within_6km(self):
        import sys, os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        from services.pricing import calcular_precio
        total = calcular_precio(5.0)
        assert total == 9990.0

    def test_price_above_6km(self):
        import sys, os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        from services.pricing import calcular_precio
        total = calcular_precio(10.0)
        assert total == 13990.0

    def test_price_exactly_6km(self):
        import sys, os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        from services.pricing import calcular_precio
        total = calcular_precio(6.0)
        assert total == 9990.0


# ==================== VISITS ====================
class TestVisits:
    def test_my_visits(self):
        _, _, h = _login("cliente@test.com", "test123")
        r = requests.get(f"{BASE_URL}/api/visits/my-visits", headers=h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
