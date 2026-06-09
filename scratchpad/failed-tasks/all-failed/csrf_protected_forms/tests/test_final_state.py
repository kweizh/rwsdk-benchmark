import os
import re
import socket

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:5173"
HEX32_RE = re.compile(r"^[0-9a-f]{32}$")


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start `npm run dev` for the RedwoodSDK project and wait for port 5173."""

    class Starter(ProcessStarter):
        name = "rwsdk_csrf_app"
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
                if s.connect_ex(("localhost", 5173)) != 0:
                    return False
            try:
                r = requests.get(f"{BASE_URL}/api/health", timeout=5)
                return r.status_code == 200
            except requests.RequestException:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def _issue_token(session: requests.Session):
    """GET /csrf with the given session, return (token, raw Set-Cookie string)."""
    r = session.get(f"{BASE_URL}/csrf", timeout=15)
    assert r.status_code == 200, f"Expected 200 from /csrf, got {r.status_code}: {r.text}"
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"/csrf must return Content-Type application/json, got: {ct}"
    )
    data = r.json()
    token = data.get("token")
    assert isinstance(token, str), f"/csrf response must contain a string 'token', got: {data}"
    assert HEX32_RE.match(token), (
        f"/csrf token must be 32 lowercase hex chars, got: {token!r}"
    )
    raw_set_cookie = r.headers.get("Set-Cookie", "")
    assert "csrf=" in raw_set_cookie, (
        f"/csrf must set a 'csrf' cookie via Set-Cookie, got headers: {dict(r.headers)}"
    )
    return token, raw_set_cookie


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_health_endpoint_no_csrf(start_app):
    session = requests.Session()
    r = session.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200, f"Expected 200 from /api/health, got {r.status_code}: {r.text}"
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"/api/health must return Content-Type application/json, got: {ct}"
    )
    body = r.json()
    assert body == {"status": "ok"}, f"/api/health body must equal {{'status': 'ok'}}, got: {body}"


def test_csrf_endpoint_returns_token_and_sets_strict_cookie(start_app):
    session = requests.Session()
    token, raw_set_cookie = _issue_token(session)

    # The Set-Cookie header must include SameSite=Strict and Path=/.
    assert re.search(r"samesite\s*=\s*strict", raw_set_cookie, re.IGNORECASE), (
        f"csrf cookie must include SameSite=Strict, got Set-Cookie: {raw_set_cookie!r}"
    )
    assert re.search(r"path\s*=\s*/", raw_set_cookie, re.IGNORECASE), (
        f"csrf cookie must include Path=/, got Set-Cookie: {raw_set_cookie!r}"
    )

    # Cookie value stored in the session must match the JSON token.
    cookie_value = session.cookies.get("csrf")
    assert cookie_value == token, (
        f"csrf cookie value ({cookie_value!r}) must equal JSON token ({token!r})"
    )


def test_csrf_token_is_regenerated_each_call(start_app):
    session_a = requests.Session()
    token_a, _ = _issue_token(session_a)

    session_b = requests.Session()
    token_b, _ = _issue_token(session_b)

    assert HEX32_RE.match(token_a) and HEX32_RE.match(token_b), (
        f"Both tokens must be 32 hex chars; got token_a={token_a!r}, token_b={token_b!r}"
    )
    assert token_a != token_b, (
        f"Each /csrf call must return a fresh token; got the same token twice: {token_a!r}"
    )


def test_post_comment_succeeds_with_valid_header_and_cookie(start_app):
    session = requests.Session()
    token, _ = _issue_token(session)

    payload = {"author": "alice", "text": "hello world"}
    r = session.post(
        f"{BASE_URL}/api/comments",
        json=payload,
        headers={"X-CSRF-Token": token},
        timeout=15,
    )
    assert r.status_code == 201, (
        f"Expected 201 from valid POST /api/comments, got {r.status_code}: {r.text}"
    )
    data = r.json()
    assert isinstance(data.get("id"), int) and data["id"] > 0, (
        f"id must be a positive int, got: {data}"
    )
    assert data.get("author") == "alice", f"Unexpected author in response: {data}"
    assert data.get("text") == "hello world", f"Unexpected text in response: {data}"


def test_post_comment_succeeds_with_form_field(start_app):
    session = requests.Session()
    token, _ = _issue_token(session)

    form = {"author": "bob", "text": "second comment", "_csrf": token}
    r = session.post(
        f"{BASE_URL}/api/comments",
        data=form,
        timeout=15,
    )
    assert r.status_code == 201, (
        f"Expected 201 from valid form POST /api/comments, got {r.status_code}: {r.text}"
    )
    data = r.json()
    assert isinstance(data.get("id"), int) and data["id"] > 0, (
        f"id must be a positive int, got: {data}"
    )
    assert data.get("author") == "bob", f"Unexpected author in response: {data}"
    assert data.get("text") == "second comment", f"Unexpected text in response: {data}"


def test_post_comment_rejected_when_header_missing(start_app):
    session = requests.Session()
    _issue_token(session)  # establish csrf cookie

    payload = {"author": "mallory", "text": "no token"}
    r = session.post(
        f"{BASE_URL}/api/comments",
        json=payload,
        timeout=15,
    )
    assert r.status_code == 403, (
        f"Expected 403 when X-CSRF-Token is missing, got {r.status_code}: {r.text}"
    )
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"403 response must be JSON, got Content-Type: {ct}"
    )
    assert r.json() == {"error": "invalid_csrf_token"}, (
        f"403 body must equal {{'error': 'invalid_csrf_token'}}, got: {r.text}"
    )


def test_post_comment_rejected_when_header_does_not_match(start_app):
    session = requests.Session()
    token, _ = _issue_token(session)
    # Construct a wrong token that is guaranteed not to equal the real one.
    wrong = "0" * 32
    if wrong == token:
        wrong = "1" * 32

    payload = {"author": "mallory", "text": "wrong token"}
    r = session.post(
        f"{BASE_URL}/api/comments",
        json=payload,
        headers={"X-CSRF-Token": wrong},
        timeout=15,
    )
    assert r.status_code == 403, (
        f"Expected 403 when X-CSRF-Token does not match cookie, got {r.status_code}: {r.text}"
    )
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"403 response must be JSON, got Content-Type: {ct}"
    )
    assert r.json() == {"error": "invalid_csrf_token"}, (
        f"403 body must equal {{'error': 'invalid_csrf_token'}}, got: {r.text}"
    )


def test_post_comment_rejected_when_no_cookie(start_app):
    session = requests.Session()  # fresh, no cookies issued
    payload = {"author": "mallory", "text": "no cookie"}
    r = session.post(
        f"{BASE_URL}/api/comments",
        json=payload,
        headers={"X-CSRF-Token": "deadbeefdeadbeefdeadbeefdeadbeef"},
        timeout=15,
    )
    assert r.status_code == 403, (
        f"Expected 403 when csrf cookie is absent, got {r.status_code}: {r.text}"
    )
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"403 response must be JSON, got Content-Type: {ct}"
    )
    assert r.json() == {"error": "invalid_csrf_token"}, (
        f"403 body must equal {{'error': 'invalid_csrf_token'}}, got: {r.text}"
    )


def test_get_comments_lists_accepted_entries(start_app):
    # First, post two known-good comments with valid tokens.
    session = requests.Session()
    token1, _ = _issue_token(session)
    r1 = session.post(
        f"{BASE_URL}/api/comments",
        json={"author": "carol", "text": "list me one"},
        headers={"X-CSRF-Token": token1},
        timeout=15,
    )
    assert r1.status_code == 201, f"setup post 1 failed: {r1.status_code} {r1.text}"
    id1 = r1.json()["id"]

    token2, _ = _issue_token(session)
    r2 = session.post(
        f"{BASE_URL}/api/comments",
        json={"author": "dave", "text": "list me two"},
        headers={"X-CSRF-Token": token2},
        timeout=15,
    )
    assert r2.status_code == 201, f"setup post 2 failed: {r2.status_code} {r2.text}"
    id2 = r2.json()["id"]

    assert id1 != id2, f"Comment ids must be unique within the process: id1={id1}, id2={id2}"

    # Then list comments (no CSRF needed for GET).
    list_session = requests.Session()
    r = list_session.get(f"{BASE_URL}/api/comments", timeout=15)
    assert r.status_code == 200, (
        f"Expected 200 from GET /api/comments, got {r.status_code}: {r.text}"
    )
    ct = r.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET /api/comments must be JSON, got Content-Type: {ct}"
    )
    body = r.json()
    assert isinstance(body, list), f"GET /api/comments must return a JSON array, got: {type(body).__name__}"

    expected_carol = {"id": id1, "author": "carol", "text": "list me one"}
    expected_dave = {"id": id2, "author": "dave", "text": "list me two"}
    assert expected_carol in body, (
        f"Expected {expected_carol} in comments list, got: {body}"
    )
    assert expected_dave in body, (
        f"Expected {expected_dave} in comments list, got: {body}"
    )

    # No rejected attempts should appear.
    for entry in body:
        assert entry.get("author") != "mallory", (
            f"Rejected 'mallory' attempt must not be persisted; got entry: {entry}"
        )


def test_get_methods_never_rejected_by_csrf(start_app):
    fresh = requests.Session()  # no cookies
    r_comments = fresh.get(f"{BASE_URL}/api/comments", timeout=15)
    assert r_comments.status_code == 200, (
        f"GET /api/comments must be 200 without csrf, got {r_comments.status_code}: {r_comments.text}"
    )
    r_health = fresh.get(f"{BASE_URL}/api/health", timeout=15)
    assert r_health.status_code == 200, (
        f"GET /api/health must be 200 without csrf, got {r_health.status_code}: {r_health.text}"
    )
