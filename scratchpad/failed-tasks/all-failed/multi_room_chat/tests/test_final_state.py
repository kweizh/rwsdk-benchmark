import os
import socket
import time
import urllib.request
import urllib.error

import pytest
from xprocess import ProcessStarter
from pochi_verifier import PochiVerifier

PROJECT_DIR = "/home/user/myproject"
HOST = "127.0.0.1"
PORT = 5173
BASE_URL = f"http://{HOST}:{PORT}"


def _run_id() -> str:
    rid = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert rid, "ZEALT_RUN_ID environment variable must be set for verification."
    return rid


def _room_a() -> str:
    return f"{_run_id()}-alpha"


def _room_b() -> str:
    return f"{_run_id()}-beta"


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
        # Use `npm run dev` and pass through Vite's --host/--port via `--`.
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
        env = os.environ.copy()
        # Disable any interactive prompts in npm.
        env.setdefault("CI", "1")
        env.setdefault("NODE_ENV", "development")
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        # Generous timeout: rwsdk needs Vite + miniflare warm-up. Dependencies
        # are pre-installed in the Docker image, so this is mostly Vite startup.
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            # First: the dev server must be accepting TCP connections on the port.
            if not _port_open("127.0.0.1", PORT):
                return False
            # Then: an HTTP request to the root should succeed (any non-5xx code).
            return _http_ok(BASE_URL + "/")

    xprocess.ensure(Starter.name, Starter)

    # Extra warm-up: hit the root once to trigger Vite's on-demand compile.
    for _ in range(60):
        if _http_ok(BASE_URL + "/"):
            break
        time.sleep(2)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def browser_verifier():
    yield PochiVerifier()


def test_chat_route_renders_ui(start_app, browser_verifier):
    room_a = _room_a()
    reason = (
        "The route /chat/:roomId must render a chat UI containing a text input "
        "for typing messages and a clickable element whose visible text contains 'Send'."
    )
    truth = (
        f"Navigate to {BASE_URL}/chat/{room_a}. "
        "Wait for the page to finish loading (the dev server may compile lazily on first request). "
        "Verify that a text input intended for typing a chat message is visible "
        "(it may be identified by a placeholder, label, name, or aria-label containing the word 'message'). "
        "Verify that a clickable element (button or similar) whose visible text contains the word 'Send' is also visible on the page."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_chat_route_renders_ui",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"


def test_post_messages_in_room_a(start_app, browser_verifier):
    room_a = _room_a()
    run_id = _run_id()
    msg1 = f"hello-alpha-{run_id}"
    msg2 = f"second-alpha-{run_id}"
    reason = (
        "Messages posted in room A must be visible in room A's message list after submission."
    )
    truth = (
        f"Navigate to {BASE_URL}/chat/{room_a}. Wait for the page to finish loading. "
        f"Type the exact text \"{msg1}\" into the chat message input field, then click the Send button (or otherwise submit the message). "
        f"Wait up to 10 seconds and verify the page text now contains \"{msg1}\". "
        f"Then type \"{msg2}\" into the chat message input field and click Send again. "
        f"Wait up to 10 seconds and verify the page text contains BOTH \"{msg1}\" and \"{msg2}\"."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_post_messages_in_room_a",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"


def test_room_b_is_isolated_from_room_a(start_app, browser_verifier):
    room_b = _room_b()
    run_id = _run_id()
    msg_a1 = f"hello-alpha-{run_id}"
    msg_a2 = f"second-alpha-{run_id}"
    msg_b = f"only-in-beta-{run_id}"
    reason = (
        "Different room IDs must hold independent message streams. Messages posted in room A "
        "must not appear in room B, and vice versa."
    )
    truth = (
        f"Navigate to {BASE_URL}/chat/{room_b} in a fresh browser tab/page. "
        "Wait for the page to finish loading. "
        f"Verify that the visible page text does NOT contain the string \"{msg_a1}\" and does NOT contain the string \"{msg_a2}\" "
        "(these messages were sent in room A and must not leak into room B). "
        f"Then type the exact text \"{msg_b}\" into the chat message input field and click Send. "
        f"Wait up to 10 seconds and verify the page text now contains \"{msg_b}\"."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_room_b_is_isolated_from_room_a",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"


def test_room_a_persists_across_reload(start_app, browser_verifier):
    room_a = _room_a()
    run_id = _run_id()
    msg_a1 = f"hello-alpha-{run_id}"
    msg_a2 = f"second-alpha-{run_id}"
    msg_b = f"only-in-beta-{run_id}"
    reason = (
        "Messages submitted in a room must persist across a full browser reload, and must remain "
        "scoped to that room (room A's reload must not show room B's messages)."
    )
    truth = (
        f"Navigate to {BASE_URL}/chat/{room_a}. Wait for the page to finish loading. "
        "Then perform a full page reload (e.g., press F5 or call the browser reload action) and wait again for the page to settle. "
        f"After the reload, verify that the visible page text contains BOTH \"{msg_a1}\" and \"{msg_a2}\". "
        f"Also verify that the visible page text does NOT contain \"{msg_b}\"."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_room_a_persists_across_reload",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"


def test_room_b_persists_across_reload(start_app, browser_verifier):
    room_b = _room_b()
    run_id = _run_id()
    msg_a1 = f"hello-alpha-{run_id}"
    msg_a2 = f"second-alpha-{run_id}"
    msg_b = f"only-in-beta-{run_id}"
    reason = (
        "Room B's messages must persist across a full browser reload and must not show room A's messages."
    )
    truth = (
        f"Navigate to {BASE_URL}/chat/{room_b}. Wait for the page to finish loading. "
        "Then perform a full page reload and wait for the page to settle. "
        f"After the reload, verify that the visible page text contains \"{msg_b}\". "
        f"Also verify that the visible page text does NOT contain \"{msg_a1}\" and does NOT contain \"{msg_a2}\"."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_room_b_persists_across_reload",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
