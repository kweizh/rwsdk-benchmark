import json
import os
import socket

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myapp"
BASE_URL = "http://localhost:5173"


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("127.0.0.1", 5173)) == 0

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _strip_jsonc(text: str) -> str:
    out = []
    i = 0
    while i < len(text):
        c = text[i]
        if c == "/" and i + 1 < len(text) and text[i + 1] == "/":
            j = text.find("\n", i)
            i = j if j != -1 else len(text)
        elif c == "/" and i + 1 < len(text) and text[i + 1] == "*":
            j = text.find("*/", i + 2)
            i = (j + 2) if j != -1 else len(text)
        else:
            out.append(c)
            i += 1
    return "".join(out)


def test_wrangler_bindings(start_app):
    path = "/home/user/myapp/wrangler.jsonc"
    with open(path) as f:
        cfg = json.loads(_strip_jsonc(f.read()))
    bindings = cfg.get("durable_objects", {}).get("bindings", [])
    assert any(
        b.get("name") == "SYNCED_STATE_SERVER" and b.get("class_name") == "SyncedStateServer"
        for b in bindings
    ), f"SYNCED_STATE_SERVER binding missing: {bindings}"
    assert any(
        "SyncedStateServer" in (m.get("new_sqlite_classes") or [])
        for m in cfg.get("migrations", [])
    ), f"SyncedStateServer migration missing: {cfg.get('migrations')}"


def test_room_pages(start_app):
    r = requests.get(f"{BASE_URL}/chat/general", timeout=30)
    assert r.status_code == 200
    assert "<h1>Room: general</h1>" in r.text, f"Room heading missing: {r.text[:400]}"
    assert "Send" in r.text, "Send button label missing"

    r2 = requests.get(f"{BASE_URL}/chat/redwood", timeout=30)
    assert "<h1>Room: redwood</h1>" in r2.text, f"Redwood room heading missing: {r2.text[:400]}"


def test_browser_chat_send_and_isolation(start_app):
    reason = (
        "Verify the RedwoodSDK realtime chat rooms based on useSyncedState handle "
        "per-room scoping: messages sent in one room must not appear in another."
    )
    truth = (
        "Navigate to http://localhost:5173/chat/general. Click the 'Clear' button. "
        "Verify no element with data-testid=\"chat-message\" is present on the page. "
        "Type 'hello redwood' into the input with data-testid=\"chat-input\". "
        "Click the button labelled 'Send'. "
        "Verify that an element with data-testid=\"chat-message\" now contains the text 'hello redwood'. "
        "Then navigate to http://localhost:5173/chat/other. "
        "Click the 'Clear' button. "
        "Verify that no visible text on the page contains 'hello redwood'."
    )
    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_chat_send_and_isolation",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
