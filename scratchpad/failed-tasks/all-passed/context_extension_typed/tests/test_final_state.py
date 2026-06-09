import os
import socket

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myapp"
BASE_URL = "http://localhost:5173"


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


def test_context_type_decl_exists(start_app):
    path = "/home/user/myapp/types/app-context.d.ts"
    assert os.path.isfile(path), f"Expected typed context declaration at {path}."
    with open(path) as f:
        body = f.read()
    assert "DefaultAppContext" in body, "Declaration must extend DefaultAppContext."
    assert "rwsdk/worker" in body, "Declaration must augment module 'rwsdk/worker'."


def test_me_anonymous(start_app):
    r = requests.get(f"{BASE_URL}/me", timeout=30)
    assert r.status_code == 200, f"GET /me returned {r.status_code}"
    body = r.json()
    assert body.get("user") in (None, {}), f"Expected null user when no headers, got: {body!r}"
    rid = body.get("requestId")
    assert isinstance(rid, str) and rid, f"requestId must be non-empty string, got: {rid!r}"
    assert r.headers.get("X-Request-Id") == rid, \
        f"X-Request-Id header must match JSON requestId. headers={r.headers}, json={body}"


def test_me_admin(start_app):
    r = requests.get(
        f"{BASE_URL}/me",
        headers={"X-User-Id": "u-123", "X-User-Role": "admin"},
        timeout=30,
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("user", {}).get("id") == "u-123", f"Expected user.id u-123: {body!r}"
    assert body.get("user", {}).get("role") == "admin", f"Expected user.role admin: {body!r}"
    rid = body.get("requestId")
    assert isinstance(rid, str) and rid
    assert r.headers.get("X-Request-Id") == rid


def test_me_default_guest(start_app):
    r = requests.get(f"{BASE_URL}/me", headers={"X-User-Id": "u-456"}, timeout=30)
    body = r.json()
    assert body.get("user", {}).get("id") == "u-456"
    assert body.get("user", {}).get("role") == "guest", f"Expected default role 'guest': {body!r}"


def test_me_member(start_app):
    r = requests.get(
        f"{BASE_URL}/me",
        headers={"X-User-Id": "u-789", "X-User-Role": "member"},
        timeout=30,
    )
    body = r.json()
    assert body.get("user", {}).get("role") == "member", f"Expected role 'member': {body!r}"


def test_me_role_endpoint(start_app):
    r = requests.get(
        f"{BASE_URL}/me/role",
        headers={"X-User-Id": "u-1", "X-User-Role": "admin"},
        timeout=30,
    )
    assert r.status_code == 200
    assert r.text.strip() == "admin", f"Expected body 'admin', got {r.text!r}"

    r2 = requests.get(f"{BASE_URL}/me/role", timeout=30)
    assert r2.text.strip() == "anonymous", f"Expected 'anonymous', got {r2.text!r}"
