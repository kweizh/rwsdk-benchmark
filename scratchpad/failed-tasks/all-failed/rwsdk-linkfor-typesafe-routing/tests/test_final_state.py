import os
import re
import socket
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
HOST = "127.0.0.1"
PORT = 5173
BASE_URL = f"http://{HOST}:{PORT}"


@pytest.fixture(scope="session")
def dev_server(xprocess):
    """
    Start the RedwoodSDK dev server (`npm run dev`) and wait until it
    is accepting TCP connections on port 5173.
    """

    env = os.environ.copy()
    # Force Vite/RedwoodSDK to bind to the expected port.
    env["PORT"] = str(PORT)

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server"
        # `--` forwards the host/port flags through `npm run dev` to vite.
        args = [
            "npm",
            "run",
            "dev",
            "--",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ]
        # IMPORTANT: env must be a class attribute, NOT inside popen_kwargs,
        # otherwise Popen raises "got multiple values for keyword argument 'env'".
        env = env
        timeout = 240
        terminate_on_interrupt = True
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                if s.connect_ex((HOST, PORT)) != 0:
                    return False
            # Also confirm the dev server is producing HTTP responses.
            try:
                r = requests.get(f"{BASE_URL}/", timeout=5)
                return r.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)

    # Small grace period for the dev server to finish first-render warm-up.
    time.sleep(2)

    yield BASE_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _get(path):
    return requests.get(f"{BASE_URL}{path}", timeout=30)


def test_home_renders_linkfor_anchor_to_profile_42(dev_server):
    """Home page must contain an <a href="/profile/42"> generated via linkFor."""
    response = _get("/")
    assert response.status_code == 200, (
        f"Expected 200 from GET /, got {response.status_code}. Body: {response.text[:500]}"
    )
    body = response.text
    pattern = re.compile(r'<a\b[^>]*\bhref=("|\')/profile/42\1', re.IGNORECASE)
    assert pattern.search(body), (
        "Expected the home page HTML to contain an anchor element with "
        "href=\"/profile/42\" (generated via linkFor). "
        f"Body snippet: {body[:1000]}"
    )


def test_profile_page_renders_id_42(dev_server):
    """GET /profile/42 must render '42' in its HTML body."""
    response = _get("/profile/42")
    assert response.status_code == 200, (
        f"Expected 200 from GET /profile/42, got {response.status_code}. Body: {response.text[:500]}"
    )
    body = response.text
    # Strip script tags to ensure '42' appears in the visible HTML body,
    # not just in client hydration payload.
    visible = re.sub(r"<script\b[^>]*>.*?</script>", "", body, flags=re.IGNORECASE | re.DOTALL)
    assert "42" in visible, (
        "Expected the visible HTML of /profile/42 to contain the id '42'. "
        f"Visible body snippet: {visible[:1000]}"
    )


def test_profile_page_renders_arbitrary_id(dev_server):
    """GET /profile/abc-123 must render 'abc-123' in its HTML body."""
    response = _get("/profile/abc-123")
    assert response.status_code == 200, (
        f"Expected 200 from GET /profile/abc-123, got {response.status_code}. Body: {response.text[:500]}"
    )
    body = response.text
    visible = re.sub(r"<script\b[^>]*>.*?</script>", "", body, flags=re.IGNORECASE | re.DOTALL)
    assert "abc-123" in visible, (
        "Expected the visible HTML of /profile/abc-123 to contain the id 'abc-123'. "
        f"Visible body snippet: {visible[:1000]}"
    )
