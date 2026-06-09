"""Final-state verification for the rwsdk-realtime-synced-counter task.

Boots the real rwsdk dev server (via `npm run dev`) inside the task container
using pytest-xprocess, and uses Playwright (Chromium) to verify the realtime
cross-tab synchronization of the Like counter.
"""

import json
import os
import re
import socket
import time
import urllib.request

import pytest
from playwright.sync_api import sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
HOST = "127.0.0.1"
PORT = 5173
BASE_URL = f"http://{HOST}:{PORT}/"


def _strip_jsonc(text: str) -> str:
    """Remove // line comments and /* */ block comments from a JSONC string."""
    # Strip block comments
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # Strip line comments (do not touch http:// inside strings — simple heuristic
    # is fine here because wrangler.jsonc does not contain URLs by default).
    out_lines = []
    for line in text.splitlines():
        # naive removal of // comments outside strings
        in_str = False
        escape = False
        cut = None
        for i, ch in enumerate(line):
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if not in_str and ch == "/" and i + 1 < len(line) and line[i + 1] == "/":
                cut = i
                break
        if cut is not None:
            line = line[:cut]
        out_lines.append(line)
    text = "\n".join(out_lines)
    # Remove trailing commas before } or ]
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session")
def dev_server(xprocess):
    """Start `npm run dev` for the rwsdk project and wait until port 5173 is open."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server"
        # `npm run dev` will boot the Vite + rwsdk dev server. We force the host
        # so it binds to all interfaces inside the container.
        args = ["npm", "run", "dev", "--", "--host", HOST, "--port", str(PORT)]
        # IMPORTANT: env / stdout / stderr / close_fds / preexec_fn must be set
        # as class attributes on ProcessStarter, NOT inside popen_kwargs.
        env = {**os.environ, "FORCE_COLOR": "0", "CI": "1"}
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open(HOST, PORT)

    xprocess.ensure(Starter.name, Starter)

    # Extra readiness wait: the port may be open before the worker is fully
    # built. Poll the root URL until it responds with HTTP 200.
    deadline = time.time() + 120
    last_err = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(BASE_URL, timeout=5) as resp:
                if resp.status == 200:
                    break
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(1.0)
    else:
        raise RuntimeError(f"Dev server never became ready at {BASE_URL}: {last_err}")

    yield BASE_URL

    info = xprocess.getinfo("rwsdk_dev_server")
    info.terminate()


def test_wrangler_registers_synced_state_durable_object():
    """wrangler.jsonc must register SyncedStateServer as a Durable Object
    bound to SYNCED_STATE_SERVER, with a new_sqlite_classes migration."""
    wrangler_path = os.path.join(PROJECT_DIR, "wrangler.jsonc")
    assert os.path.isfile(wrangler_path), f"{wrangler_path} not found"

    with open(wrangler_path, encoding="utf-8") as f:
        raw = f.read()
    config = json.loads(_strip_jsonc(raw))

    do = config.get("durable_objects") or {}
    bindings = do.get("bindings") or []
    matching = [
        b
        for b in bindings
        if isinstance(b, dict)
        and b.get("name") == "SYNCED_STATE_SERVER"
        and b.get("class_name") == "SyncedStateServer"
    ]
    assert matching, (
        "Expected wrangler.jsonc to declare a Durable Object binding with "
        "name 'SYNCED_STATE_SERVER' and class_name 'SyncedStateServer', "
        f"got: {bindings!r}"
    )

    migrations = config.get("migrations") or []
    assert any(
        isinstance(m, dict) and "SyncedStateServer" in (m.get("new_sqlite_classes") or [])
        for m in migrations
    ), (
        "Expected wrangler.jsonc migrations to include a 'new_sqlite_classes' "
        f"entry containing 'SyncedStateServer', got: {migrations!r}"
    )


def test_document_includes_client_hydration_script(dev_server):
    """The Document shell must include the client.tsx hydration script,
    otherwise the Like button click handler will not run."""
    with urllib.request.urlopen(dev_server, timeout=15) as resp:
        assert resp.status == 200, f"GET / returned status {resp.status}"
        body = resp.read().decode("utf-8", errors="replace")
    assert '<script type="module" src="/src/client.tsx"></script>' in body, (
        "Document shell at '/' must include the client hydration script tag "
        "'<script type=\"module\" src=\"/src/client.tsx\"></script>'. "
        "Received body: " + body[:500]
    )


def _wait_for_count_text(page, expected, timeout_s=15.0):
    """Poll the [data-testid=like-count] element until its text equals `expected`."""
    deadline = time.time() + timeout_s
    last_seen = None
    while time.time() < deadline:
        try:
            text = page.locator('[data-testid="like-count"]').inner_text(timeout=1000)
            last_seen = text.strip()
            if last_seen == str(expected):
                return
        except Exception:  # noqa: BLE001
            pass
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for like-count to become {expected!r}; last value seen: {last_seen!r}"
    )


def _read_count(page):
    text = page.locator('[data-testid="like-count"]').inner_text(timeout=5000)
    return int(text.strip())


def test_realtime_like_counter_syncs_across_tabs(dev_server):
    """End-to-end realtime check: clicking 'Like' in one tab updates the
    counter in another open tab without a reload."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context()
            ctx_b = browser.new_context()
            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(dev_server, wait_until="domcontentloaded")
            page_b.goto(dev_server, wait_until="domcontentloaded")

            # The "Like" button and the count element must both exist.
            page_a.locator('button:has-text("Like")').wait_for(state="visible", timeout=20000)
            page_b.locator('button:has-text("Like")').wait_for(state="visible", timeout=20000)
            page_a.locator('[data-testid="like-count"]').wait_for(state="attached", timeout=20000)
            page_b.locator('[data-testid="like-count"]').wait_for(state="attached", timeout=20000)

            # Give the WebSocket connection a moment to attach so both tabs are
            # observing the same initial value.
            time.sleep(1.0)
            initial_b = _read_count(page_b)
            initial_a = _read_count(page_a)
            assert initial_a == initial_b, (
                f"Both tabs should observe the same initial synced count, "
                f"got A={initial_a} B={initial_b}"
            )

            # --- A -> B propagation ---
            like_a = page_a.locator('button:has-text("Like")')
            for _ in range(3):
                like_a.click()
                time.sleep(0.1)

            # Tab A should reflect its own clicks within a few seconds.
            _wait_for_count_text(page_a, initial_a + 3, timeout_s=10.0)
            # Tab B must see the same updated value without reloading.
            _wait_for_count_text(page_b, initial_b + 3, timeout_s=10.0)

            # --- B -> A propagation ---
            value_a_before = _read_count(page_a)
            page_b.locator('button:has-text("Like")').click()
            _wait_for_count_text(page_b, initial_b + 4, timeout_s=10.0)
            _wait_for_count_text(page_a, value_a_before + 1, timeout_s=10.0)
        finally:
            browser.close()
