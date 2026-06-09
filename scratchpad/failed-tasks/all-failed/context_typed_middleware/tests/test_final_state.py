import os
import socket
import subprocess

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("localhost", PORT)) != 0:
                    return False
            # Also verify the server actually responds to HTTP
            try:
                r = requests.get(f"{BASE_URL}/api/context", timeout=5)
                return r.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_typescript_compiles_cleanly():
    """`npx tsc --noEmit` must exit 0 in the project directory."""
    result = subprocess.run(
        ["npx", "--no-install", "tsc", "--noEmit"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=300,
    )
    assert result.returncode == 0, (
        "Expected `npx tsc --noEmit` to succeed with exit code 0, "
        f"got returncode={result.returncode}.\n"
        f"stdout:\n{result.stdout}\n"
        f"stderr:\n{result.stderr}"
    )


def test_context_anonymous_no_tenant(start_app):
    """GET /api/context without headers => user null, default tenant."""
    r = requests.get(f"{BASE_URL}/api/context", timeout=30)
    assert r.status_code == 200, (
        f"Expected 200 from /api/context, got {r.status_code}. Body: {r.text}"
    )
    ct = r.headers.get("content-type", "")
    assert "application/json" in ct.lower(), (
        f"Expected JSON content-type, got {ct!r}. Body: {r.text}"
    )
    data = r.json()
    assert data.get("user") is None, (
        f"Expected user to be null for anonymous request, got {data.get('user')!r}"
    )
    tenant = data.get("tenant")
    assert isinstance(tenant, dict), f"Expected tenant object, got {tenant!r}"
    assert tenant.get("id") == "tenant-default", (
        f"Expected tenant.id 'tenant-default', got {tenant.get('id')!r}"
    )
    assert tenant.get("name") == "Tenant tenant-default", (
        f"Expected tenant.name 'Tenant tenant-default', got {tenant.get('name')!r}"
    )
    elapsed = data.get("elapsedMs")
    assert isinstance(elapsed, int) and elapsed >= 0, (
        f"Expected elapsedMs to be a non-negative integer, got {elapsed!r}"
    )


def test_context_admin_user_with_tenant(start_app):
    """GET /api/context with admin bearer + X-Tenant-Id."""
    r = requests.get(
        f"{BASE_URL}/api/context",
        headers={
            "Authorization": "Bearer demo-admin-42",
            "X-Tenant-Id": "acme",
        },
        timeout=30,
    )
    assert r.status_code == 200, (
        f"Expected 200, got {r.status_code}. Body: {r.text}"
    )
    data = r.json()
    assert data.get("user") == {"id": "42", "role": "admin"}, (
        f"Expected user={{'id':'42','role':'admin'}}, got {data.get('user')!r}"
    )
    tenant = data.get("tenant") or {}
    assert tenant.get("id") == "acme", (
        f"Expected tenant.id 'acme', got {tenant.get('id')!r}"
    )
    assert tenant.get("name") == "Tenant acme", (
        f"Expected tenant.name 'Tenant acme', got {tenant.get('name')!r}"
    )
    elapsed = data.get("elapsedMs")
    assert isinstance(elapsed, int) and elapsed >= 0, (
        f"Expected elapsedMs to be a non-negative integer, got {elapsed!r}"
    )


def test_context_regular_user(start_app):
    """GET /api/context with a regular user bearer token."""
    r = requests.get(
        f"{BASE_URL}/api/context",
        headers={
            "Authorization": "Bearer demo-user-7",
            "X-Tenant-Id": "globex",
        },
        timeout=30,
    )
    assert r.status_code == 200, (
        f"Expected 200, got {r.status_code}. Body: {r.text}"
    )
    data = r.json()
    assert data.get("user") == {"id": "7", "role": "user"}, (
        f"Expected user={{'id':'7','role':'user'}}, got {data.get('user')!r}"
    )
    tenant = data.get("tenant") or {}
    assert tenant.get("id") == "globex", (
        f"Expected tenant.id 'globex', got {tenant.get('id')!r}"
    )
    assert tenant.get("name") == "Tenant globex", (
        f"Expected tenant.name 'Tenant globex', got {tenant.get('name')!r}"
    )


def test_admin_route_admin_user(start_app):
    """GET /api/admin with admin bearer => 200 {ok:true}."""
    r = requests.get(
        f"{BASE_URL}/api/admin",
        headers={"Authorization": "Bearer demo-admin-42"},
        timeout=30,
    )
    assert r.status_code == 200, (
        f"Expected 200 for admin, got {r.status_code}. Body: {r.text}"
    )
    assert r.json() == {"ok": True}, (
        f"Expected body {{'ok': True}}, got {r.text!r}"
    )


def test_admin_route_regular_user_forbidden(start_app):
    """GET /api/admin with regular user => 403 {error:'forbidden'}."""
    r = requests.get(
        f"{BASE_URL}/api/admin",
        headers={"Authorization": "Bearer demo-user-7"},
        timeout=30,
    )
    assert r.status_code == 403, (
        f"Expected 403 for non-admin, got {r.status_code}. Body: {r.text}"
    )
    assert r.json() == {"error": "forbidden"}, (
        f"Expected body {{'error':'forbidden'}}, got {r.text!r}"
    )


def test_admin_route_anonymous_forbidden(start_app):
    """GET /api/admin without Authorization => 403."""
    r = requests.get(f"{BASE_URL}/api/admin", timeout=30)
    assert r.status_code == 403, (
        f"Expected 403 for anonymous, got {r.status_code}. Body: {r.text}"
    )
    assert r.json() == {"error": "forbidden"}, (
        f"Expected body {{'error':'forbidden'}}, got {r.text!r}"
    )


def test_admin_route_malformed_bearer_forbidden(start_app):
    """GET /api/admin with malformed bearer token => 403."""
    r = requests.get(
        f"{BASE_URL}/api/admin",
        headers={"Authorization": "Bearer not-a-demo-token"},
        timeout=30,
    )
    assert r.status_code == 403, (
        f"Expected 403 for malformed bearer, got {r.status_code}. Body: {r.text}"
    )
    assert r.json() == {"error": "forbidden"}, (
        f"Expected body {{'error':'forbidden'}}, got {r.text!r}"
    )
