import json
import os
import socket

import pytest
import requests
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


def test_wrangler_cron_config(start_app):
    path = "/home/user/myapp/wrangler.jsonc"
    assert os.path.isfile(path), f"Missing {path}"
    with open(path) as f:
        raw = f.read()
    cfg = json.loads(_strip_jsonc(raw))
    crons = cfg.get("triggers", {}).get("crons", [])
    for needed in ("* * * * *", "0 * * * *", "0 21 * * *"):
        assert needed in crons, f"wrangler.jsonc triggers.crons missing {needed!r}: {crons}"


def test_ping(start_app):
    r = requests.get(f"{BASE_URL}/cron/ping", timeout=30)
    assert r.status_code == 200
    assert r.text.strip() == "pong"


def test_scheduled_handler_appends(start_app):
    # Reset log first
    requests.get(f"{BASE_URL}/cron/clear", timeout=30)

    r1 = requests.get(
        f"{BASE_URL}/cdn-cgi/handler/scheduled",
        params={"cron": "* * * * *"},
        timeout=30,
    )
    assert r1.status_code == 200, f"First scheduled invocation failed: {r1.status_code}"

    r2 = requests.get(
        f"{BASE_URL}/cdn-cgi/handler/scheduled",
        params={"cron": "0 * * * *"},
        timeout=30,
    )
    assert r2.status_code == 200, f"Second scheduled invocation failed: {r2.status_code}"

    rlog = requests.get(f"{BASE_URL}/cron/log", timeout=30)
    assert rlog.status_code == 200
    log = rlog.json()
    entries = log.get("entries", [])
    assert len(entries) == 2, f"Expected 2 entries after two crons, got: {entries}"
    assert entries[0].get("cron") == "* * * * *", f"First entry cron mismatch: {entries[0]}"
    assert entries[1].get("cron") == "0 * * * *", f"Second entry cron mismatch: {entries[1]}"


def test_clear(start_app):
    r = requests.get(f"{BASE_URL}/cron/clear", timeout=30)
    assert r.status_code == 200
    assert r.text.strip() == "cleared"
    rlog = requests.get(f"{BASE_URL}/cron/log", timeout=30)
    assert rlog.json().get("entries", None) == []
