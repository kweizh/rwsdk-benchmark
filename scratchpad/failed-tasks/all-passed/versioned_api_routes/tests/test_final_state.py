import os
import socket

import pytest
import requests
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"


EXPECTED_USERS = [
    {"id": "u1", "name": "Alice", "email": "alice@example.com"},
    {"id": "u2", "name": "Bob", "email": "bob@example.com"},
    {"id": "u3", "name": "Cyrus", "email": "cyrus@example.com"},
]


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the RedwoodSDK dev server using xprocess."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server"
        args = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", str(APP_PORT)]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    if s.connect_ex(("localhost", APP_PORT)) != 0:
                        return False
                resp = requests.get(f"{BASE_URL}/v1/users", timeout=10)
                return resp.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _get(path: str) -> requests.Response:
    return requests.get(f"{BASE_URL}{path}", timeout=15, allow_redirects=False)


def _assert_json_content_type(resp: requests.Response, path: str) -> None:
    ct = resp.headers.get("Content-Type", "")
    assert "application/json" in ct.lower(), (
        f"GET {path} Content-Type must include 'application/json'; got {ct!r}."
    )


def _assert_version_header(resp: requests.Response, expected: str, path: str) -> None:
    actual = resp.headers.get("X-API-Version")
    assert actual == expected, (
        f"GET {path} expected response header 'X-API-Version: {expected}', "
        f"got {actual!r}."
    )


def test_v1_users_list_returns_id_name_only(start_app):
    path = "/v1/users"
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} expected 200, got {resp.status_code}. Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "1", path)
    _assert_json_content_type(resp, path)

    payload = resp.json()
    assert isinstance(payload, list), (
        f"GET {path} body must be a JSON array; got {type(payload).__name__}."
    )
    assert len(payload) == 3, (
        f"GET {path} must return exactly 3 users; got {len(payload)}: {payload!r}."
    )

    for entry in payload:
        assert isinstance(entry, dict), (
            f"GET {path} array entries must be JSON objects; got {entry!r}."
        )
        assert set(entry.keys()) == {"id", "name"}, (
            f"GET {path} entries must contain ONLY keys {{'id','name'}}; "
            f"got keys {sorted(entry.keys())!r} for entry {entry!r}. "
            "The 'email' field must NOT be exposed by /v1."
        )
        assert "email" not in entry, (
            f"GET {path} must NOT expose an 'email' field on /v1; got {entry!r}."
        )

    actual_pairs = {(e["id"], e["name"]) for e in payload}
    expected_pairs = {(u["id"], u["name"]) for u in EXPECTED_USERS}
    assert actual_pairs == expected_pairs, (
        f"GET {path} returned user (id,name) set {sorted(actual_pairs)!r}; "
        f"expected {sorted(expected_pairs)!r}."
    )


@pytest.mark.parametrize("user", EXPECTED_USERS, ids=[u["id"] for u in EXPECTED_USERS])
def test_v1_user_detail_returns_id_name_only(start_app, user):
    path = f"/v1/users/{user['id']}"
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} expected 200, got {resp.status_code}. Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "1", path)
    _assert_json_content_type(resp, path)

    payload = resp.json()
    assert isinstance(payload, dict), (
        f"GET {path} body must be a JSON object; got {type(payload).__name__}."
    )
    assert set(payload.keys()) == {"id", "name"}, (
        f"GET {path} body must contain ONLY keys {{'id','name'}}; "
        f"got keys {sorted(payload.keys())!r}. /v1 must NOT expose 'email'."
    )
    assert payload["id"] == user["id"], (
        f"GET {path} 'id' expected {user['id']!r}, got {payload['id']!r}."
    )
    assert payload["name"] == user["name"], (
        f"GET {path} 'name' expected {user['name']!r}, got {payload['name']!r}."
    )


def test_v1_unknown_user_returns_404(start_app):
    path = "/v1/users/does-not-exist"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404 for unknown id; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "1", path)
    payload = resp.json()
    assert payload == {"error": "not_found"}, (
        f"GET {path} 404 body must equal {{'error':'not_found'}}; got {payload!r}."
    )


def test_v2_users_list_includes_email(start_app):
    path = "/v2/users"
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} expected 200, got {resp.status_code}. Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "2", path)
    _assert_json_content_type(resp, path)

    payload = resp.json()
    assert isinstance(payload, list), (
        f"GET {path} body must be a JSON array; got {type(payload).__name__}."
    )
    assert len(payload) == 3, (
        f"GET {path} must return exactly 3 users; got {len(payload)}: {payload!r}."
    )

    for entry in payload:
        assert isinstance(entry, dict), (
            f"GET {path} entries must be JSON objects; got {entry!r}."
        )
        assert set(entry.keys()) == {"id", "name", "email"}, (
            f"GET {path} entries must contain ONLY keys {{'id','name','email'}}; "
            f"got keys {sorted(entry.keys())!r} for entry {entry!r}."
        )

    actual_triples = {(e["id"], e["name"], e["email"]) for e in payload}
    expected_triples = {(u["id"], u["name"], u["email"]) for u in EXPECTED_USERS}
    assert actual_triples == expected_triples, (
        f"GET {path} user set mismatch. Got {sorted(actual_triples)!r}; "
        f"expected {sorted(expected_triples)!r}."
    )


@pytest.mark.parametrize("user", EXPECTED_USERS, ids=[u["id"] for u in EXPECTED_USERS])
def test_v2_user_detail_includes_email(start_app, user):
    path = f"/v2/users/{user['id']}"
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} expected 200, got {resp.status_code}. Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "2", path)
    _assert_json_content_type(resp, path)

    payload = resp.json()
    assert isinstance(payload, dict), (
        f"GET {path} body must be a JSON object; got {type(payload).__name__}."
    )
    assert set(payload.keys()) == {"id", "name", "email"}, (
        f"GET {path} body must contain ONLY keys {{'id','name','email'}}; "
        f"got keys {sorted(payload.keys())!r}."
    )
    assert payload["id"] == user["id"], (
        f"GET {path} 'id' expected {user['id']!r}, got {payload['id']!r}."
    )
    assert payload["name"] == user["name"], (
        f"GET {path} 'name' expected {user['name']!r}, got {payload['name']!r}."
    )
    assert payload["email"] == user["email"], (
        f"GET {path} 'email' expected {user['email']!r}, got {payload['email']!r}."
    )


def test_v2_unknown_user_returns_404(start_app):
    path = "/v2/users/u404"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404 for unknown id; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    _assert_version_header(resp, "2", path)
    payload = resp.json()
    assert payload == {"error": "not_found"}, (
        f"GET {path} 404 body must equal {{'error':'not_found'}}; got {payload!r}."
    )


def test_version_headers_are_isolated(start_app):
    v1_list = _get("/v1/users")
    v1_detail = _get("/v1/users/u1")
    v2_list = _get("/v2/users")
    v2_detail = _get("/v2/users/u1")

    for resp, path in [(v1_list, "/v1/users"), (v1_detail, "/v1/users/u1")]:
        assert resp.headers.get("X-API-Version") == "1", (
            f"GET {path} must set 'X-API-Version: 1'; got "
            f"{resp.headers.get('X-API-Version')!r}."
        )
        assert resp.headers.get("X-API-Version") != "2", (
            f"GET {path} must NOT set 'X-API-Version: 2'."
        )

    for resp, path in [(v2_list, "/v2/users"), (v2_detail, "/v2/users/u1")]:
        assert resp.headers.get("X-API-Version") == "2", (
            f"GET {path} must set 'X-API-Version: 2'; got "
            f"{resp.headers.get('X-API-Version')!r}."
        )
        assert resp.headers.get("X-API-Version") != "1", (
            f"GET {path} must NOT set 'X-API-Version: 1'."
        )
