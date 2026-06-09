import json
import os
import re
import socket

import pytest
import requests
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"

HTML_SENTINEL = "BOOM_HTML_SENTINEL_DO_NOT_LEAK_8c7f3e2a"
JSON_SENTINEL = "BOOM_JSON_SENTINEL_DO_NOT_LEAK_4b1d9f60"


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the RedwoodSDK dev server using xprocess."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server"
        args = ["npm", "run", "dev"]
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
                # Any HTTP response (even error) means the server is up.
                resp = requests.get(f"{BASE_URL}/", timeout=10)
                return resp.status_code < 600
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _get(path: str) -> requests.Response:
    return requests.get(f"{BASE_URL}{path}", timeout=15, allow_redirects=False)


def _has_anchor_to_root(html: str) -> bool:
    """Return True if the HTML contains an <a> whose href resolves to '/'."""
    # Match href="/", href='/', or href=/  (with optional surrounding whitespace).
    pattern = re.compile(
        r"<a\b[^>]*\bhref\s*=\s*(?:\"\s*/\s*\"|'\s*/\s*'|/(?=[\s>]))",
        re.IGNORECASE,
    )
    return bool(pattern.search(html))


def test_home_returns_200_with_welcome(start_app):
    resp = _get("/")
    assert resp.status_code == 200, (
        f"GET / must return 200; got {resp.status_code}. Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("text/html"), (
        f"GET / Content-Type must start with 'text/html'; got '{ct}'."
    )
    assert "Welcome" in resp.text, (
        f"GET / response body must contain 'Welcome'. Body snippet: {resp.text[:500]}"
    )


def test_unmatched_html_route_returns_404_custom_page(start_app):
    path = "/this-page-definitely-does-not-exist"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404 (NOT 200); got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("text/html"), (
        f"GET {path} Content-Type must start with 'text/html'; got '{ct}'."
    )
    assert "Page not found" in resp.text, (
        f"GET {path} body must contain 'Page not found'. "
        f"Body snippet: {resp.text[:500]}"
    )
    assert _has_anchor_to_root(resp.text), (
        f"GET {path} body must contain an <a href=\"/\"> link back to home. "
        f"Body snippet: {resp.text[:1000]}"
    )


def test_unmatched_html_nested_route_returns_404_custom_page(start_app):
    path = "/foo/bar/baz"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("text/html"), (
        f"GET {path} Content-Type must start with 'text/html'; got '{ct}'."
    )
    assert "Page not found" in resp.text, (
        f"GET {path} body must contain 'Page not found'. "
        f"Body snippet: {resp.text[:500]}"
    )
    assert _has_anchor_to_root(resp.text), (
        f"GET {path} body must contain an <a href=\"/\"> link back to home. "
        f"Body snippet: {resp.text[:1000]}"
    )


def test_boom_returns_500_html_and_does_not_leak_error(start_app):
    resp = _get("/boom")
    assert resp.status_code == 500, (
        f"GET /boom must return 500; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("text/html"), (
        f"GET /boom Content-Type must start with 'text/html'; got '{ct}'."
    )
    assert "Something broke" in resp.text, (
        f"GET /boom body must contain 'Something broke'. "
        f"Body snippet: {resp.text[:500]}"
    )
    assert HTML_SENTINEL not in resp.text, (
        f"GET /boom must NOT leak the original thrown error message "
        f"({HTML_SENTINEL!r}) into the HTML response. Body snippet: "
        f"{resp.text[:1000]}"
    )


def test_api_unknown_path_returns_json_404(start_app):
    path = "/api/missing"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET {path} Content-Type must start with 'application/json'; got '{ct}'."
    )
    try:
        payload = resp.json()
    except json.JSONDecodeError as e:
        pytest.fail(
            f"GET {path} response body is not valid JSON: {e}. "
            f"Body: {resp.text[:500]}"
        )
    assert payload == {"error": "not_found", "path": "/api/missing"}, (
        f"GET {path} JSON body must equal "
        f'{{"error": "not_found", "path": "/api/missing"}}; got {payload!r}.'
    )


def test_api_unknown_deep_path_returns_json_404(start_app):
    path = "/api/does/not/exist"
    resp = _get(path)
    assert resp.status_code == 404, (
        f"GET {path} must return 404; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET {path} Content-Type must start with 'application/json'; got '{ct}'."
    )
    try:
        payload = resp.json()
    except json.JSONDecodeError as e:
        pytest.fail(
            f"GET {path} response body is not valid JSON: {e}. "
            f"Body: {resp.text[:500]}"
        )
    assert payload == {"error": "not_found", "path": "/api/does/not/exist"}, (
        f"GET {path} JSON body must equal "
        f'{{"error": "not_found", "path": "/api/does/not/exist"}}; got {payload!r}.'
    )


def test_api_boom_returns_json_500_and_does_not_leak_error(start_app):
    resp = _get("/api/boom")
    assert resp.status_code == 500, (
        f"GET /api/boom must return 500; got {resp.status_code}. "
        f"Body: {resp.text[:500]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET /api/boom Content-Type must start with 'application/json'; "
        f"got '{ct}'."
    )
    try:
        payload = resp.json()
    except json.JSONDecodeError as e:
        pytest.fail(
            f"GET /api/boom response body is not valid JSON: {e}. "
            f"Body: {resp.text[:500]}"
        )
    assert payload == {"error": "internal_server_error"}, (
        f"GET /api/boom JSON body must equal "
        f'{{"error": "internal_server_error"}}; got {payload!r}.'
    )
    assert JSON_SENTINEL not in resp.text, (
        f"GET /api/boom must NOT leak the original thrown error message "
        f"({JSON_SENTINEL!r}) into the JSON response. Body: {resp.text[:500]}"
    )


def test_server_remains_stable_after_throwing_routes(start_app):
    # Hit throwing routes multiple times in alternation, then confirm '/' still works.
    for path in ["/boom", "/api/boom", "/boom", "/api/boom"]:
        resp = _get(path)
        assert resp.status_code == 500, (
            f"Stability check: GET {path} must still return 500; "
            f"got {resp.status_code}."
        )

    final = _get("/")
    assert final.status_code == 200, (
        f"After repeated throws, GET / must still return 200; "
        f"got {final.status_code}. The dev server appears to have been "
        f"destabilized by the throwing routes."
    )
    assert "Welcome" in final.text, (
        "After repeated throws, GET / must still contain 'Welcome' in its body."
    )
