"""Backend regression tests for IT Ticketing & KPI Management System."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                    break
    except Exception:
        pass
API = f"{BASE_URL}/api"


def login(identifier, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"identifier": identifier, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed {identifier}: {r.status_code} {r.text}"
    return s, r.json()


@pytest.fixture(scope="session")
def admin_session():
    s, u = login("admin", "admin123")
    return s, u


@pytest.fixture(scope="session")
def tech_session():
    s, u = login("tech1", "password123")
    return s, u


@pytest.fixture(scope="session")
def customer_session():
    s, u = login("customer1", "password123")
    return s, u


# ---------- Auth ----------
class TestAuth:
    def test_login_admin_username(self):
        s, u = login("admin", "admin123")
        assert u["role"] == "admin"
        assert u["username"] == "admin"
        assert "password_hash" not in u

    def test_login_admin_email(self):
        s, u = login("admin@itsm.local", "admin123")
        assert u["role"] == "admin"

    def test_login_tech(self):
        s, u = login("tech1", "password123")
        assert u["role"] == "technician"

    def test_login_customer(self):
        s, u = login("customer1", "password123")
        assert u["role"] == "customer"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"identifier": "admin", "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_no_cookie(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401


# ---------- Users ----------
class TestUsers:
    def test_list_users_admin(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/users", timeout=30)
        assert r.status_code == 200
        users = r.json()
        assert any(u["username"] == "tech1" for u in users)

    def test_list_users_customer_forbidden(self, customer_session):
        s, _ = customer_session
        r = s.get(f"{API}/users", timeout=30)
        assert r.status_code == 403

    def test_create_user(self, admin_session):
        s, _ = admin_session
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "email": f"test_{suffix}@example.com",
            "username": f"test_{suffix}",
            "name": "TEST User",
            "password": "testpass123",
            "role": "technician",
            "department": "IT-Test",
        }
        r = s.post(f"{API}/users", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["email"] == payload["email"]
        assert "password_hash" not in u

        # verify listable
        r2 = s.get(f"{API}/users", timeout=30)
        assert any(x["username"] == payload["username"] for x in r2.json())


# ---------- Categories ----------
class TestCategories:
    def test_list_categories(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/categories", timeout=30)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) >= 3
        assert all("id" in c and "name" in c for c in cats)

    def test_create_category(self, admin_session):
        s, _ = admin_session
        r = s.post(f"{API}/categories", json={"name": f"TEST_{uuid.uuid4().hex[:6]}", "subcategories": ["A", "B"]}, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"].startswith("TEST_")


# ---------- Tickets ----------
class TestTickets:
    def test_list_tickets_admin(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/tickets", timeout=30)
        assert r.status_code == 200
        tickets = r.json()
        assert len(tickets) >= 5
        t = tickets[0]
        assert "sla" in t and "number" in t and "priority" in t
        assert "_id" not in t

    def test_list_tickets_customer_scoped(self, customer_session):
        s, u = customer_session
        r = s.get(f"{API}/tickets", timeout=30)
        assert r.status_code == 200
        for t in r.json():
            assert t["customer_id"] == u["id"]

    def test_filter_status_priority(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/tickets", params={"status": "Closed", "priority": "Critical"}, timeout=30)
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "Closed" and t["priority"] == "Critical"

    def test_search_tickets(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/tickets", params={"q": "laptop"}, timeout=30)
        assert r.status_code == 200

    def test_create_ticket_and_assign_flow(self, admin_session):
        s, _ = admin_session
        cats = s.get(f"{API}/categories").json()
        cid = cats[0]["id"]
        r = s.post(f"{API}/tickets", json={
            "subject": "TEST_ticket " + uuid.uuid4().hex[:6],
            "description": "Automated test ticket",
            "category_id": cid,
            "subcategory": "Laptop",
            "priority": "High",
        }, timeout=30)
        assert r.status_code == 200, r.text
        t = r.json()
        tid = t["id"]
        assert t["status"] == "Open"
        assert t["number"].startswith("TKT-")
        assert "sla" in t

        # GET verify
        g = s.get(f"{API}/tickets/{tid}").json()
        assert g["id"] == tid
        assert g["subject"] == t["subject"]

        # assign
        techs = [u for u in s.get(f"{API}/users").json() if u["role"] == "technician"]
        assert techs
        tech_id = techs[0]["id"]
        r2 = s.post(f"{API}/tickets/{tid}/assign", json={"technician_id": tech_id}, timeout=30)
        assert r2.status_code == 200
        g2 = s.get(f"{API}/tickets/{tid}").json()
        assert g2["technician_id"] == tech_id
        assert g2["status"] == "Assigned"

        # activities
        acts = s.get(f"{API}/tickets/{tid}/activities").json()
        assert any(a["type"] == "assigned" for a in acts)

    def test_technician_status_and_resolve(self, admin_session, tech_session):
        adm_s, _ = admin_session
        tech_s, tech_u = tech_session
        # Create ticket via admin & assign to tech1
        cats = adm_s.get(f"{API}/categories").json()
        r = adm_s.post(f"{API}/tickets", json={
            "subject": "TEST_resolve " + uuid.uuid4().hex[:6],
            "description": "Test resolve",
            "category_id": cats[0]["id"],
            "priority": "Medium",
        })
        tid = r.json()["id"]
        adm_s.post(f"{API}/tickets/{tid}/assign", json={"technician_id": tech_u["id"]})

        # Tech changes to On Progress
        rs = tech_s.post(f"{API}/tickets/{tid}/status", json={"status": "On Progress"})
        assert rs.status_code == 200

        # Resolve
        rr = tech_s.post(f"{API}/tickets/{tid}/resolve", json={
            "root_cause": "Test root cause",
            "resolution": "Test resolution applied",
            "technician_notes": "notes",
            "documentation_complete": True,
        })
        assert rr.status_code == 200

        g = tech_s.get(f"{API}/tickets/{tid}").json()
        assert g["status"] == "Resolved"
        assert g["resolution"] == "Test resolution applied"

    def test_customer_rating_flow(self, admin_session, tech_session, customer_session):
        adm_s, _ = admin_session
        tech_s, tech_u = tech_session
        cust_s, cust_u = customer_session
        cats = adm_s.get(f"{API}/categories").json()
        # customer creates ticket
        r = cust_s.post(f"{API}/tickets", json={
            "subject": "TEST_rate " + uuid.uuid4().hex[:6],
            "description": "Rate flow",
            "category_id": cats[0]["id"],
            "priority": "Low",
        })
        assert r.status_code == 200, r.text
        tid = r.json()["id"]
        # admin assigns
        adm_s.post(f"{API}/tickets/{tid}/assign", json={"technician_id": tech_u["id"]})
        # tech resolves
        tech_s.post(f"{API}/tickets/{tid}/resolve", json={
            "root_cause": "rc", "resolution": "done", "technician_notes": "n", "documentation_complete": True,
        })
        # customer rates
        rr = cust_s.post(f"{API}/tickets/{tid}/rate", json={"rating": 5, "feedback": "great"})
        assert rr.status_code == 200
        g = cust_s.get(f"{API}/tickets/{tid}").json()
        assert g["rating"] == 5
        assert g["status"] == "Closed"

    def test_customer_cannot_change_status(self, customer_session):
        s, u = customer_session
        # Get first ticket of customer
        tickets = s.get(f"{API}/tickets").json()
        if not tickets:
            pytest.skip("No customer tickets")
        r = s.post(f"{API}/tickets/{tickets[0]['id']}/status", json={"status": "Closed"})
        assert r.status_code == 403


# ---------- Dashboard / KPI ----------
class TestDashboardKPI:
    def test_dashboard_summary(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/dashboard/summary")
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "counts", "by_priority", "by_category", "by_technician", "by_month",
                  "sla_compliance", "avg_response_min", "avg_resolution_min"]:
            assert k in d

    def test_kpi_scores(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/kpi/scores")
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 1
        for row in rows:
            assert "kpi_score" in row and "performance" in row
            assert row["performance"] in ("Excellent", "Good", "Fair", "Needs Improvement")

    def test_kpi_customer_forbidden(self, customer_session):
        s, _ = customer_session
        r = s.get(f"{API}/kpi/scores")
        assert r.status_code == 403


# ---------- Settings ----------
class TestSettings:
    def test_get_sla(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/settings/sla")
        assert r.status_code == 200
        assert "Critical" in r.json()

    def test_put_sla(self, admin_session):
        s, _ = admin_session
        current = s.get(f"{API}/settings/sla").json()
        current["High"]["response"] = 31
        r = s.put(f"{API}/settings/sla", json={"rules": current})
        assert r.status_code == 200
        got = s.get(f"{API}/settings/sla").json()
        assert got["High"]["response"] == 31

    def test_kpi_weights_validation(self, admin_session):
        s, _ = admin_session
        cur = s.get(f"{API}/settings/kpi").json()
        bad = dict(cur)
        bad_weights = {k: 50 for k in cur["weights"]}  # sums >>100
        r = s.put(f"{API}/settings/kpi", json={"weights": bad_weights, "thresholds": cur["thresholds"], "productivity_target": cur["productivity_target"]})
        assert r.status_code == 400

    def test_kpi_save(self, admin_session):
        s, _ = admin_session
        cur = s.get(f"{API}/settings/kpi").json()
        r = s.put(f"{API}/settings/kpi", json={"weights": cur["weights"], "thresholds": cur["thresholds"], "productivity_target": cur["productivity_target"]})
        assert r.status_code == 200

    def test_integrations_empty_save(self, admin_session):
        s, _ = admin_session
        r = s.put(f"{API}/settings/integrations", json={
            "telegram_bot_token": "", "telegram_chat_id": "",
            "whatsapp_provider": "", "whatsapp_api_key": "", "whatsapp_sender": "",
        })
        assert r.status_code == 200
        r2 = s.get(f"{API}/settings/integrations")
        assert r2.status_code == 200


# ---------- Reports ----------
class TestReports:
    def test_kpi_csv(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/reports/kpi/export", params={"fmt": "csv"})
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert b"Technician" in r.content

    def test_kpi_pdf(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/reports/kpi/export", params={"fmt": "pdf"})
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_tickets_csv(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/reports/tickets/export", params={"fmt": "csv"})
        assert r.status_code == 200
        assert b"Number" in r.content

    def test_tickets_pdf(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/reports/tickets/export", params={"fmt": "pdf"})
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# ---------- Audit Log ----------
class TestAudit:
    def test_audit_admin(self, admin_session):
        s, _ = admin_session
        r = s.get(f"{API}/audit-logs")
        assert r.status_code == 200
        logs = r.json()
        assert len(logs) >= 1
        assert "user_name" in logs[0]

    def test_audit_customer_forbidden(self, customer_session):
        s, _ = customer_session
        r = s.get(f"{API}/audit-logs")
        assert r.status_code == 403
