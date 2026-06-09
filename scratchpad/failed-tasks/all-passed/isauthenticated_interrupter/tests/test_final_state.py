import os
import socket

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myapp"
BASE_URL = "http://localhost:5173"
GOOD = {"Authorization": "Bearer secret-token"}
BAD = {"Authorization": "Bearer wrong-token"}


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("127.0.0.1", 5173)) == 0

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_public_route(start_app):
    r = requests.get(f"{BASE_URL}/public/hello", timeout=30)
    assert r.status_code == 200, f"GET /public/hello returned {r.status_code}"
    assert r.text.strip() == "hello-public", f"Unexpected body: {r.text!r}"


def test_admin_dashboard_blocked_without_header(start_app):
    r = requests.get(f"{BASE_URL}/admin/dashboard", timeout=30)
    assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
    assert "Unauthorized" in r.text, f"Expected 'Unauthorized' body, got {r.text!r}"


def test_admin_dashboard_blocked_with_bad_token(start_app):
    r = requests.get(f"{BASE_URL}/admin/dashboard", headers=BAD, timeout=30)
    assert r.status_code == 401, f"Expected 401 with wrong token, got {r.status_code}"


def test_admin_dashboard_passes_with_good_token(start_app):
    r = requests.get(f"{BASE_URL}/admin/dashboard", headers=GOOD, timeout=30)
    assert r.status_code == 200, f"Expected 200 with valid token, got {r.status_code}"
    assert r.text.strip() == "admin-dashboard-ok", f"Unexpected body: {r.text!r}"


def test_admin_users_blocked_without_header(start_app):
    r = requests.get(f"{BASE_URL}/admin/users", timeout=30)
    assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"


def test_admin_users_passes_with_good_token(start_app):
    r = requests.get(f"{BASE_URL}/admin/users", headers=GOOD, timeout=30)
    assert r.status_code == 200, f"Expected 200 with valid token, got {r.status_code}"
    assert r.json() == {"users": ["alice", "bob"]}, f"Unexpected JSON: {r.text!r}"
