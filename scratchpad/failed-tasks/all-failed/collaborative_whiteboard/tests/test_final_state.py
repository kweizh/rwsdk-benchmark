import os
import socket
import time
import urllib.error
import urllib.request

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
HOST = "127.0.0.1"
PORT = 5173
BASE_URL = f"http://{HOST}:{PORT}"


def _run_id() -> str:
    rid = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert rid, "ZEALT_RUN_ID environment variable must be set for verification."
    return rid


def _board_id() -> str:
    return f"{_run_id()}-board"


def _board_id_b() -> str:
    return f"{_run_id()}-other"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _http_ok(url: str, timeout: float = 5.0) -> bool:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= resp.status < 500
    except (urllib.error.URLError, urllib.error.HTTPError, ConnectionError, TimeoutError, OSError):
        return False


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the RedwoodSDK dev server (Vite + miniflare) for the project."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = [
            "npm",
            "run",
            "dev",
            "--",
            "--host",
            "0.0.0.0",
            "--port",
            str(PORT),
        ]
        # CRITICAL: set `env` as a class attribute here, NEVER inside `popen_kwargs`.
        env = os.environ.copy()
        env.setdefault("CI", "1")
        env.setdefault("NODE_ENV", "development")
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        # Generous timeout: rwsdk needs Vite + miniflare warm-up.
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            if not _port_open(HOST, PORT):
                return False
            return _http_ok(BASE_URL + "/")

    xprocess.ensure(Starter.name, Starter)

    # Extra warm-up: trigger Vite's on-demand compile of the board route.
    deadline = time.time() + 120
    while time.time() < deadline:
        if _http_ok(f"{BASE_URL}/board/{_board_id()}"):
            break
        time.sleep(2)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def browser_verifier():
    yield PochiVerifier()


def test_board_page_has_client_hydration_script(start_app):
    """Verification step 1: GET /board/<id> should include a script for /src/client.tsx."""
    url = f"{BASE_URL}/board/{_board_id()}"
    response = requests.get(url, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}: {response.text[:500]}"
    )
    body = response.text
    assert "/src/client.tsx" in body, (
        "Expected the Document to include a script tag with src '/src/client.tsx' "
        "for client hydration; otherwise useSyncedState handlers will not run."
    )


def test_initial_board_state_is_empty(start_app):
    """Verification step 2: GET /api/board/<id> should initially return {dots: []}."""
    url = f"{BASE_URL}/api/board/{_board_id()}"
    response = requests.get(url, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}: {response.text}"
    )
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, (
        f"Expected Content-Type to include application/json, got: {content_type}"
    )
    body = response.json()
    assert body == {"dots": []}, (
        f"Expected initial body {{'dots': []}}, got: {body}"
    )


def test_click_adds_dots_across_two_tabs(start_app, browser_verifier):
    """Verification step 3: drive two tabs in the same browser session and verify sync."""
    board_id = _board_id()
    reason = (
        "Clicks on the whiteboard must add coloured dots that appear in real time "
        "across every browser tab viewing the same board, via useSyncedState."
    )
    truth = (
        f"Open {BASE_URL}/board/{board_id} in tab A. Wait for the page to finish loading "
        "(the dev server may compile lazily on first request). Verify that a clickable "
        "drawing surface (a canvas element or another visible element clearly used for "
        "drawing) is present, and that a button or clickable element whose visible text "
        "contains the word 'Clear' is also visible. Click on the drawing surface three "
        "times at three clearly different positions inside the surface (e.g., near the "
        "top-left, near the centre, and near the bottom-right). Verify that three "
        "distinct coloured dots are now visible on the surface in tab A. "
        f"Open {BASE_URL}/board/{board_id} in a second tab (tab B) in the same browser "
        "context. Verify that tab B also shows three coloured dots on the surface "
        "without you clicking anywhere in tab B. Click once on the drawing surface in "
        "tab B at a fresh position. Switch back to tab A and verify, without refreshing, "
        "that tab A now shows four coloured dots in total."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_click_adds_dots_across_two_tabs",
    )
    assert result.status == "pass", (
        f"Browser verification failed: {getattr(result, 'reason', '')}"
    )


def test_api_reflects_four_added_dots(start_app):
    """Verification step 4: JSON state must reflect the four dots added in step 3."""
    url = f"{BASE_URL}/api/board/{_board_id()}"
    response = requests.get(url, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}: {response.text}"
    )
    body = response.json()
    assert isinstance(body, dict) and "dots" in body, (
        f"Expected JSON object with a 'dots' field, got: {body}"
    )
    dots = body["dots"]
    assert isinstance(dots, list), (
        f"Expected 'dots' to be a list, got: {type(dots).__name__}"
    )
    assert len(dots) == 4, (
        f"Expected exactly 4 dots after the browser interaction, got {len(dots)}: {dots}"
    )
    for i, dot in enumerate(dots):
        assert isinstance(dot, dict), (
            f"Expected dot[{i}] to be an object, got: {dot!r}"
        )
        for field in ("x", "y", "color"):
            assert field in dot, (
                f"Expected dot[{i}] to contain field '{field}', got: {dot!r}"
            )
        assert isinstance(dot["x"], (int, float)) and not isinstance(dot["x"], bool), (
            f"Expected dot[{i}]['x'] to be a number, got: {dot['x']!r}"
        )
        assert isinstance(dot["y"], (int, float)) and not isinstance(dot["y"], bool), (
            f"Expected dot[{i}]['y'] to be a number, got: {dot['y']!r}"
        )
        assert isinstance(dot["color"], str) and dot["color"].strip(), (
            f"Expected dot[{i}]['color'] to be a non-empty string, got: {dot['color']!r}"
        )


def test_other_board_id_is_isolated(start_app):
    """Verification step 5: a different board ID must hold an independent (empty) dot list."""
    url = f"{BASE_URL}/api/board/{_board_id_b()}"
    response = requests.get(url, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}: {response.text}"
    )
    body = response.json()
    assert body == {"dots": []}, (
        "Dots added on one board must NOT leak into another board. "
        f"Expected {{'dots': []}} for {_board_id_b()}, got: {body}"
    )


def test_clear_button_empties_board(start_app, browser_verifier):
    """Verification step 6: clicking Clear must empty the board for all viewers."""
    board_id = _board_id()
    reason = (
        "Clicking 'Clear' must empty the shared dot list for the current board for "
        "every connected client."
    )
    truth = (
        f"Open {BASE_URL}/board/{board_id} in a single browser tab. Wait for the page "
        "to finish loading. Verify that coloured dots are currently visible on the "
        "drawing surface (there should be at least one). Then click the 'Clear' button. "
        "Wait up to 10 seconds and verify that the drawing surface now shows no "
        "coloured dots at all."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_clear_button_empties_board",
    )
    assert result.status == "pass", (
        f"Browser verification failed: {getattr(result, 'reason', '')}"
    )


def test_api_empty_after_clear(start_app):
    """Verification step 7: JSON state must be empty after the Clear button is pressed."""
    url = f"{BASE_URL}/api/board/{_board_id()}"
    # Give the synced-state propagation a brief window to settle after the click.
    deadline = time.time() + 15
    body = None
    while time.time() < deadline:
        response = requests.get(url, timeout=30)
        assert response.status_code == 200, (
            f"Expected 200 from GET {url}, got {response.status_code}: {response.text}"
        )
        body = response.json()
        if body == {"dots": []}:
            return
        time.sleep(1)
    assert body == {"dots": []}, (
        f"Expected board to be empty after Clear, got: {body}"
    )
