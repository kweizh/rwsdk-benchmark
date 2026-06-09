import os
import re
import socket
import time

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"
DASHBOARD_URL = f"{BASE_URL}/dashboard"

PANEL_NAMES = ["revenue", "users", "orders"]
PANEL_FINAL_TEXT = {
    "revenue": "$12,345",
    "users": "1,024 active users",
    "orders": "7 orders today",
}


def _wait_for_port(host: str, port: int, timeout: float) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(0.5)
    return False


def _panel_marker_present(html: str, panel: str, state: str) -> bool:
    """Check that some element carries both data-panel="<panel>" and data-state="<state>"
    in any attribute order on the same tag."""
    pattern = re.compile(
        r"<[^>]*\bdata-panel\s*=\s*\"" + re.escape(panel) + r"\"[^>]*"
        r"\bdata-state\s*=\s*\"" + re.escape(state) + r"\"[^>]*>",
        re.IGNORECASE,
    )
    pattern_rev = re.compile(
        r"<[^>]*\bdata-state\s*=\s*\"" + re.escape(state) + r"\"[^>]*"
        r"\bdata-panel\s*=\s*\"" + re.escape(panel) + r"\"[^>]*>",
        re.IGNORECASE,
    )
    return bool(pattern.search(html) or pattern_rev.search(html))


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", str(PORT)]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                return s.connect_ex(("localhost", PORT)) == 0

    xprocess.ensure(Starter.name, Starter)

    # Warm up the dev server: first request can take a while to compile.
    deadline = time.time() + 240
    last_err = None
    while time.time() < deadline:
        try:
            r = requests.get(BASE_URL + "/", timeout=10)
            if r.status_code < 500:
                break
        except Exception as e:
            last_err = e
            time.sleep(1)
    else:
        raise RuntimeError(f"Dev server did not respond in time: {last_err}")

    # Also warm up /dashboard so the very first verifier read is fast.
    try:
        requests.get(DASHBOARD_URL, timeout=60)
    except Exception:
        pass

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_dashboard_streams_loading_markers_first(start_app):
    """The initial chunk of /dashboard must contain all three loading markers,
    received before the slowest 3s panel can resolve."""
    start = time.time()
    chunk = b""
    with requests.get(DASHBOARD_URL, stream=True, timeout=15) as resp:
        assert resp.status_code == 200, (
            f"GET {DASHBOARD_URL} returned status {resp.status_code}; expected 200."
        )
        # Read until we have ~32KB OR 0.8s have elapsed (well under the 3s slowest panel).
        for raw in resp.iter_content(chunk_size=1024):
            if raw:
                chunk += raw
            if len(chunk) >= 32 * 1024:
                break
            if time.time() - start > 0.8:
                break

    html = chunk.decode("utf-8", errors="ignore")

    for panel in PANEL_NAMES:
        assert _panel_marker_present(html, panel, "loading"), (
            f"Initial streamed chunk does not contain a loading marker for panel "
            f"'{panel}' (expected an element with both data-panel=\"{panel}\" and "
            f"data-state=\"loading\"). Got prefix: {html[:1000]!r}"
        )

    # The final values must NOT have arrived yet in the very first chunk.
    for panel, final_text in PANEL_FINAL_TEXT.items():
        assert final_text not in html, (
            f"Initial streamed chunk already contains final value '{final_text}' for "
            f"panel '{panel}'; the page does not appear to be streaming progressively."
        )


def test_dashboard_full_response_contains_final_values(start_app):
    """Reading the response to completion must yield all three resolved panels."""
    resp = requests.get(DASHBOARD_URL, timeout=30)
    assert resp.status_code == 200, (
        f"GET {DASHBOARD_URL} returned status {resp.status_code}; expected 200."
    )
    html = resp.text

    for panel in PANEL_NAMES:
        assert _panel_marker_present(html, panel, "ready"), (
            f"Full streamed response does not contain a ready marker for panel "
            f"'{panel}' (expected an element with both data-panel=\"{panel}\" and "
            f"data-state=\"ready\")."
        )

    for panel, final_text in PANEL_FINAL_TEXT.items():
        assert final_text in html, (
            f"Full streamed response does not contain final value '{final_text}' for "
            f"panel '{panel}'."
        )


def test_dashboard_browser_verification(start_app):
    reason = (
        "The /dashboard route must render three independent panels (Revenue, Users, "
        "Recent Orders) via React Server Components with Suspense, each streamed in "
        "progressively. After all panels resolve, the page must show their final values."
    )
    truth = (
        "Navigate to http://localhost:5173/dashboard and wait up to 10 seconds. "
        "Verify that the final page contains the texts '$12,345', '1,024 active users', "
        "and '7 orders today'. Verify that the final DOM contains an element with "
        "attributes data-panel=\"revenue\" and data-state=\"ready\", an element with "
        "data-panel=\"users\" and data-state=\"ready\", and an element with "
        "data-panel=\"orders\" and data-state=\"ready\"."
    )

    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_dashboard_browser_verification",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
