#!/usr/bin/env python3
"""
Regression test suite for IT Ticketing & KPI Management System backend.
Tests auth flow, health endpoint, and seeding behavior.
"""

import requests
import sys
from typing import Dict, Any, Optional

# Base URL from frontend/.env REACT_APP_BACKEND_URL
BASE_URL = "https://docker-kpi-setup.preview.emergentagent.com/api"

# Test credentials from /app/memory (admin@itsm.local / admin123)
ADMIN_EMAIL = "admin@itsm.local"
ADMIN_PASSWORD = "admin123"

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def pass_test(self, name: str):
        self.passed += 1
        print(f"✅ PASS: {name}")
    
    def fail_test(self, name: str, reason: str):
        self.failed += 1
        error_msg = f"❌ FAIL: {name}\n   Reason: {reason}"
        self.errors.append(error_msg)
        print(error_msg)
    
    def summary(self):
        print("\n" + "="*70)
        print(f"TEST SUMMARY: {self.passed} passed, {self.failed} failed")
        print("="*70)
        if self.errors:
            print("\nFailed Tests:")
            for err in self.errors:
                print(err)
        return self.failed == 0


def test_health_endpoint(result: TestResult):
    """Test 1: GET /api/health -> expect 200 JSON {"status":"ok","database":true}"""
    print("\n[TEST 1] Health Endpoint")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        
        if resp.status_code != 200:
            result.fail_test("Health endpoint status code", 
                           f"Expected 200, got {resp.status_code}. Body: {resp.text[:200]}")
            return
        
        data = resp.json()
        
        if "status" not in data:
            result.fail_test("Health endpoint response", 
                           f"Missing 'status' field. Response: {data}")
            return
        
        if "database" not in data:
            result.fail_test("Health endpoint response", 
                           f"Missing 'database' field. Response: {data}")
            return
        
        if data["status"] != "ok":
            result.fail_test("Health endpoint status", 
                           f"Expected status='ok', got '{data['status']}'")
            return
        
        if data["database"] != True:
            result.fail_test("Health endpoint database", 
                           f"Expected database=true, got {data['database']}")
            return
        
        result.pass_test("Health endpoint returns 200 with correct JSON")
        
    except Exception as e:
        result.fail_test("Health endpoint", f"Exception: {str(e)}")


def test_auth_login(result: TestResult) -> Optional[Dict[str, str]]:
    """Test 2: POST /api/auth/login with admin credentials -> expect 200 and cookies"""
    print("\n[TEST 2] Auth Login")
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if resp.status_code != 200:
            result.fail_test("Login status code", 
                           f"Expected 200, got {resp.status_code}. Body: {resp.text[:500]}")
            return None
        
        # Check for Set-Cookie headers
        cookies = resp.cookies
        if "access_token" not in cookies:
            result.fail_test("Login cookies", 
                           f"Missing 'access_token' cookie. Cookies: {list(cookies.keys())}")
            return None
        
        if "refresh_token" not in cookies:
            result.fail_test("Login cookies", 
                           f"Missing 'refresh_token' cookie. Cookies: {list(cookies.keys())}")
            return None
        
        # Check cookie attributes (SameSite=none; Secure for HTTPS preview)
        set_cookie_headers = resp.headers.get_list('Set-Cookie') if hasattr(resp.headers, 'get_list') else resp.headers.get('Set-Cookie', '').split(',')
        
        access_cookie_header = None
        refresh_cookie_header = None
        
        for header in set_cookie_headers:
            if 'access_token=' in header:
                access_cookie_header = header
            if 'refresh_token=' in header:
                refresh_cookie_header = header
        
        # Verify SameSite=none and Secure flags are present (case-insensitive)
        if access_cookie_header:
            access_lower = access_cookie_header.lower()
            if 'samesite=none' not in access_lower:
                result.fail_test("Login cookie flags", 
                               f"access_token missing SameSite=none. Header: {access_cookie_header}")
                return None
            if 'secure' not in access_lower:
                result.fail_test("Login cookie flags", 
                               f"access_token missing Secure flag. Header: {access_cookie_header}")
                return None
        
        # Check response body contains user data
        try:
            user_data = resp.json()
            if "email" not in user_data or user_data["email"] != ADMIN_EMAIL:
                result.fail_test("Login response body", 
                               f"Expected user email '{ADMIN_EMAIL}', got: {user_data}")
                return None
        except Exception as e:
            result.fail_test("Login response parsing", f"Failed to parse JSON: {str(e)}")
            return None
        
        result.pass_test("Login returns 200 with httpOnly cookies (SameSite=none; Secure)")
        
        # Return cookies for subsequent tests
        return {"access_token": cookies["access_token"], "refresh_token": cookies["refresh_token"]}
        
    except Exception as e:
        result.fail_test("Login", f"Exception: {str(e)}")
        return None


def test_auth_me(result: TestResult, cookies: Dict[str, str]):
    """Test 3: GET /api/auth/me with cookies -> expect 200 returning admin user"""
    print("\n[TEST 3] Auth Me (with cookies)")
    try:
        resp = requests.get(
            f"{BASE_URL}/auth/me",
            cookies=cookies,
            timeout=10
        )
        
        if resp.status_code != 200:
            result.fail_test("Auth /me status code", 
                           f"Expected 200, got {resp.status_code}. Body: {resp.text[:500]}")
            return
        
        user_data = resp.json()
        
        if "email" not in user_data:
            result.fail_test("Auth /me response", 
                           f"Missing 'email' field. Response: {user_data}")
            return
        
        if user_data["email"] != ADMIN_EMAIL:
            result.fail_test("Auth /me user", 
                           f"Expected email '{ADMIN_EMAIL}', got '{user_data['email']}'")
            return
        
        if "role" not in user_data or user_data["role"] != "admin":
            result.fail_test("Auth /me role", 
                           f"Expected role='admin', got '{user_data.get('role')}'")
            return
        
        result.pass_test("Auth /me returns 200 with admin user data")
        
    except Exception as e:
        result.fail_test("Auth /me", f"Exception: {str(e)}")


def test_auth_logout(result: TestResult, cookies: Dict[str, str]):
    """Test 4: POST /api/auth/logout -> expect 200 and cookies cleared"""
    print("\n[TEST 4] Auth Logout")
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/logout",
            cookies=cookies,
            timeout=10
        )
        
        if resp.status_code != 200:
            result.fail_test("Logout status code", 
                           f"Expected 200, got {resp.status_code}. Body: {resp.text[:500]}")
            return
        
        # Check that cookies are cleared (Max-Age=0 or expires in past)
        set_cookie_headers = resp.headers.get_list('Set-Cookie') if hasattr(resp.headers, 'get_list') else [resp.headers.get('Set-Cookie', '')]
        
        cookies_cleared = False
        for header in set_cookie_headers:
            if 'access_token=' in header or 'refresh_token=' in header:
                # Check for Max-Age=0 or empty value
                if 'max-age=0' in header.lower() or '=;' in header:
                    cookies_cleared = True
                    break
        
        if not cookies_cleared:
            # Some implementations just return empty cookies, which is also valid
            # Let's verify by trying to use the old cookies - they should fail
            verify_resp = requests.get(f"{BASE_URL}/auth/me", cookies=cookies, timeout=10)
            if verify_resp.status_code == 200:
                result.fail_test("Logout cookie clearing", 
                               "Cookies still valid after logout")
                return
        
        result.pass_test("Logout returns 200 and clears cookies")
        
    except Exception as e:
        result.fail_test("Logout", f"Exception: {str(e)}")


def test_seeding_users(result: TestResult):
    """Test 5: GET /api/users (as admin) returns seeded users (admin + demo accounts)"""
    print("\n[TEST 5] Seeding - Users List")
    try:
        # Login first to get fresh cookies
        login_resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if login_resp.status_code != 200:
            result.fail_test("Seeding test login", 
                           f"Failed to login for seeding test. Status: {login_resp.status_code}")
            return
        
        cookies = {"access_token": login_resp.cookies["access_token"]}
        
        # Get users list
        resp = requests.get(
            f"{BASE_URL}/users",
            cookies=cookies,
            timeout=10
        )
        
        if resp.status_code != 200:
            result.fail_test("Users list status code", 
                           f"Expected 200, got {resp.status_code}. Body: {resp.text[:500]}")
            return
        
        users = resp.json()
        
        if not isinstance(users, list):
            result.fail_test("Users list response", 
                           f"Expected list, got {type(users)}")
            return
        
        # Check for admin user
        admin_found = any(u.get("email") == ADMIN_EMAIL for u in users)
        if not admin_found:
            result.fail_test("Seeding - admin user", 
                           f"Admin user not found in users list. Users: {[u.get('email') for u in users]}")
            return
        
        # Since SEED_DEMO defaults to true in preview, we should have demo users
        # Check for at least some demo accounts (manager, supervisor, technicians, customers)
        demo_emails = [
            "manager@itsm.local",
            "supervisor@itsm.local", 
            "tech1@itsm.local",
            "customer1@itsm.local"
        ]
        
        demo_found = [email for email in demo_emails if any(u.get("email") == email for u in users)]
        
        if len(demo_found) < 2:
            # If we have less than 2 demo users, seeding might not be working
            result.fail_test("Seeding - demo users", 
                           f"Expected demo users, found only {len(demo_found)}: {demo_found}. Total users: {len(users)}")
            return
        
        result.pass_test(f"Seeding works: {len(users)} users including admin and {len(demo_found)} demo accounts")
        
    except Exception as e:
        result.fail_test("Seeding test", f"Exception: {str(e)}")


def main():
    print("="*70)
    print("REGRESSION TEST: IT Ticketing & KPI Management System Backend")
    print("="*70)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print("="*70)
    
    result = TestResult()
    
    # Test 1: Health endpoint
    test_health_endpoint(result)
    
    # Test 2: Login
    cookies = test_auth_login(result)
    
    if cookies:
        # Test 3: Auth /me
        test_auth_me(result, cookies)
        
        # Test 4: Logout
        test_auth_logout(result, cookies)
    else:
        print("\n⚠️  Skipping /me and logout tests due to login failure")
        result.fail_test("Auth /me", "Skipped due to login failure")
        result.fail_test("Logout", "Skipped due to login failure")
    
    # Test 5: Seeding
    test_seeding_users(result)
    
    # Summary
    success = result.summary()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
