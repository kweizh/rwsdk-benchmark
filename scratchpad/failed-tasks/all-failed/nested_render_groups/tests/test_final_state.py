import json
import os
import re
import socket

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"

MARKETING_ROUTES = ["/", "/pricing"]
APP_ROUTES = ["/app", "/app/profile", "/app/settings"]


# Regex helpers ----------------------------------------------------------------

LANG_RE = re.compile(r'<html[^>]*\blang\s*=\s*"en"', re.IGNORECASE)
CHARSET_RE = re.compile(
    r'<meta[^>]*\bchar[sS]et\s*=\s*"utf-8"', re.IGNORECASE
)
VIEWPORT_RE = re.compile(
    r'<meta[^>]*\bname\s*=\s*"viewport"', re.IGNORECASE
)
MARKETING_HEADER_RE = re.compile(
    r'class\s*=\s*"[^"]*\bmarketing-header\b', re.IGNORECASE
)
APP_HEADER_RE = re.compile(
    r'class\s*=\s*"[^"]*\bapp-header\b', re.IGNORECASE
)
# Match a hydration <script ...> tag that references /src/client.tsx with
# type="module" — attributes may appear in any order.
HYDRATION_SCRIPT_RE = re.compile(
    r'<script\b(?=[^>]*\btype\s*=\s*"module")(?=[^>]*\bsrc\s*=\s*"/src/client\.tsx")',
    re.IGNORECASE,
)


@pytest.fixture(scope="session")
def browser_verifier():
    return PochiVerifier()


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
                resp = requests.get(f"{BASE_URL}/", timeout=5)
                return resp.status_code == 200
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _get(path: str) -> requests.Response:
    return requests.get(f"{BASE_URL}{path}", timeout=20)


def _assert_common_document(body: str, path: str) -> None:
    assert LANG_RE.search(body), (
        f"{path}: expected <html lang=\"en\"> in response.\n"
        f"Body head:\n{body[:1500]}"
    )
    assert CHARSET_RE.search(body), (
        f"{path}: expected a <meta charset=\"utf-8\"> tag.\n"
        f"Body head:\n{body[:1500]}"
    )
    assert VIEWPORT_RE.search(body), (
        f"{path}: expected a <meta name=\"viewport\" ...> tag.\n"
        f"Body head:\n{body[:1500]}"
    )


# Marketing routes -------------------------------------------------------------


@pytest.mark.parametrize("path", MARKETING_ROUTES)
def test_marketing_routes_use_marketing_document(start_app, path):
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} returned {resp.status_code}, expected 200."
    )
    content_type = resp.headers.get("Content-Type", "")
    assert "text/html" in content_type.lower(), (
        f"GET {path} Content-Type expected to contain 'text/html', got "
        f"'{content_type}'."
    )
    body = resp.text
    _assert_common_document(body, path)
    assert MARKETING_HEADER_RE.search(body), (
        f"{path}: expected an element with class 'marketing-header'.\n"
        f"Body head:\n{body[:2000]}"
    )
    assert not APP_HEADER_RE.search(body), (
        f"{path}: must NOT contain class 'app-header' (marketing pages "
        f"should use MarketingDocument, not AppDocument).\n"
        f"Body head:\n{body[:2000]}"
    )
    assert not HYDRATION_SCRIPT_RE.search(body), (
        f"{path}: marketing pages must NOT include "
        f"<script type=\"module\" src=\"/src/client.tsx\"> (no client "
        f"hydration on marketing routes).\n"
        f"Body head:\n{body[:2000]}"
    )


def test_pricing_page_has_label(start_app):
    resp = _get("/pricing")
    assert resp.status_code == 200
    assert re.search(r"Pricing", resp.text, re.IGNORECASE), (
        "/pricing must render a recognizable 'Pricing' label in its body."
    )


# App routes -------------------------------------------------------------------


@pytest.mark.parametrize("path", APP_ROUTES)
def test_app_routes_use_app_document(start_app, path):
    resp = _get(path)
    assert resp.status_code == 200, (
        f"GET {path} returned {resp.status_code}, expected 200."
    )
    content_type = resp.headers.get("Content-Type", "")
    assert "text/html" in content_type.lower(), (
        f"GET {path} Content-Type expected to contain 'text/html', got "
        f"'{content_type}'."
    )
    body = resp.text
    _assert_common_document(body, path)
    assert APP_HEADER_RE.search(body), (
        f"{path}: expected an element with class 'app-header'.\n"
        f"Body head:\n{body[:2000]}"
    )
    assert not MARKETING_HEADER_RE.search(body), (
        f"{path}: must NOT contain class 'marketing-header' (app routes "
        f"should use AppDocument, not MarketingDocument).\n"
        f"Body head:\n{body[:2000]}"
    )
    assert HYDRATION_SCRIPT_RE.search(body), (
        f"{path}: expected hydration script "
        f"<script type=\"module\" src=\"/src/client.tsx\"> in the document.\n"
        f"Body head:\n{body[:2000]}"
    )


def test_app_profile_page_has_label(start_app):
    resp = _get("/app/profile")
    assert resp.status_code == 200
    assert re.search(r"Profile", resp.text, re.IGNORECASE), (
        "/app/profile must render a recognizable 'Profile' label in its body."
    )


def test_app_settings_page_has_label(start_app):
    resp = _get("/app/settings")
    assert resp.status_code == 200
    assert re.search(r"Settings", resp.text, re.IGNORECASE), (
        "/app/settings must render a recognizable 'Settings' label in its body."
    )


# Raw JSON API route -----------------------------------------------------------


def test_api_health_returns_json(start_app):
    resp = _get("/api/health")
    assert resp.status_code == 200, (
        f"GET /api/health returned {resp.status_code}, expected 200."
    )
    content_type = resp.headers.get("Content-Type", "")
    assert content_type.lower().startswith("application/json"), (
        f"/api/health Content-Type must start with 'application/json'; "
        f"got '{content_type}'."
    )
    body = resp.text
    assert "<html" not in body.lower(), (
        "/api/health response body must NOT contain '<html' — it must be raw "
        "JSON, not a Document-wrapped HTML page."
    )
    try:
        payload = resp.json()
    except json.JSONDecodeError as e:
        pytest.fail(
            f"/api/health body is not valid JSON: {e}. Body: {body[:500]}"
        )
    assert payload == {"status": "ok"}, (
        f"/api/health JSON body must equal {{'status': 'ok'}}; got {payload!r}."
    )


# Browser verification ---------------------------------------------------------


def test_browser_marketing_vs_app_documents(start_app, browser_verifier):
    reason = (
        "The app must use two independent `render(Document, [...])` groups in "
        "rwsdk: a MarketingDocument (light theme, with a `marketing-header`) "
        "for `/` and `/pricing`, and an AppDocument (dark theme, with an "
        "`app-header` and client hydration) for `/app` routes. The marketing "
        "pages must NOT carry the app header; the app pages must NOT carry "
        "the marketing header, must be hydrated, and must set "
        "document.body.dataset.theme to 'dark' on load."
    )
    truth = (
        "Open http://localhost:5173/. Verify the page contains a visible "
        "element with class 'marketing-header'. Verify that no element with "
        "class 'app-header' exists on this page. Then navigate to "
        "http://localhost:5173/app. Verify the page contains a visible "
        "element with class 'app-header' and that no element with class "
        "'marketing-header' exists on this page. After the page hydrates, "
        "evaluate `document.body.dataset.theme` in the browser; it must "
        "equal the exact string 'dark'."
    )

    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_marketing_vs_app_documents",
    )
    assert result.status == "pass", (
        f"Browser verification failed: {result.reason}"
    )


def test_browser_theme_toggle(start_app, browser_verifier):
    reason = (
        "The AppDocument must expose a client component that toggles the "
        "theme stored on document.body.dataset.theme between 'dark' and "
        "'light'. The marketing pages should not be affected."
    )
    truth = (
        "Open http://localhost:5173/app. Wait for the page to hydrate. "
        "Evaluate `document.body.dataset.theme` in the browser; it must "
        "equal the exact string 'dark'. Locate the theme toggle control on "
        "the page (a button or similar clickable element related to theme) "
        "and click it. After the click, `document.body.dataset.theme` must "
        "equal the exact string 'light'. Click the toggle once more; "
        "`document.body.dataset.theme` must equal 'dark' again."
    )

    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_theme_toggle",
    )
    assert result.status == "pass", (
        f"Browser verification failed: {result.reason}"
    )
