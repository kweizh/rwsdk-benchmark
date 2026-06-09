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


def test_logging_flow(start_app):
    r1 = requests.get(f"{BASE_URL}/track/ping", headers={"User-Agent": "zealt-tester/1"}, timeout=30)
    assert r1.status_code == 200 and r1.text.strip() == "tracked", \
        f"/track/ping unexpected: {r1.status_code} {r1.text!r}"

    r2 = requests.get(f"{BASE_URL}/track/pong", headers={"User-Agent": "zealt-tester/2"}, timeout=30)
    assert r2.status_code == 200 and r2.text.strip() == "tracked", \
        f"/track/pong unexpected: {r2.status_code} {r2.text!r}"

    rlast = requests.get(f"{BASE_URL}/debug/last", timeout=30)
    assert rlast.status_code == 200
    assert "application/json" in rlast.headers.get("content-type", "").lower()
    last = rlast.json()
    assert last.get("method") == "GET", f"Expected method GET, got {last!r}"
    assert last.get("path") == "/track/pong", f"Expected last path /track/pong, got {last!r}"
    assert last.get("userAgent") == "zealt-tester/2", f"Unexpected userAgent: {last!r}"

    rlog = requests.get(f"{BASE_URL}/debug/log", timeout=30)
    assert rlog.status_code == 200
    assert "application/json" in rlog.headers.get("content-type", "").lower()
    log = rlog.json()
    assert "entries" in log and "count" in log, f"/debug/log missing fields: {log!r}"
    entries = log["entries"]
    assert isinstance(entries, list), f"`entries` must be a list, got: {entries!r}"
    assert log["count"] == len(entries), f"count {log['count']} != entries length {len(entries)}"
    paths = [e.get("path") for e in entries]
    assert "/track/ping" in paths, f"/track/ping missing from log entries: {paths!r}"
    assert "/track/pong" in paths, f"/track/pong missing from log entries: {paths!r}"
    assert paths.index("/track/ping") < paths.index("/track/pong"), \
        f"Entries not in chronological order: {paths!r}"
