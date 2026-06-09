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


def test_prefix_usage_in_source(start_app):
    candidates = [
        "/home/user/myapp/src/worker.tsx",
        "/home/user/myapp/src/worker.ts",
    ]
    contents = ""
    for c in candidates:
        if os.path.isfile(c):
            with open(c) as f:
                contents = f.read()
            break
    assert contents, "Worker entry file not found."
    assert 'prefix("/api/v1"' in contents or "prefix('/api/v1'" in contents, \
        "Expected `prefix(\"/api/v1\", ...)` call in worker entry."


def test_v1_ping(start_app):
    r = requests.get(f"{BASE_URL}/api/v1/ping", timeout=30)
    assert r.status_code == 200
    assert r.json() == {"version": "v1", "pong": True}, f"unexpected: {r.json()}"


@pytest.mark.parametrize("msg", ["hello", "redwood"])
def test_v1_echo(start_app, msg):
    r = requests.get(f"{BASE_URL}/api/v1/echo/{msg}", timeout=30)
    assert r.status_code == 200
    assert r.json() == {"version": "v1", "echo": msg}, f"unexpected: {r.json()}"


def test_v1_profile(start_app):
    r = requests.get(f"{BASE_URL}/api/v1/users/42/profile", timeout=30)
    assert r.status_code == 200
    assert r.json() == {"version": "v1", "userId": "42", "profile": True}, \
        f"unexpected: {r.json()}"


def test_v2_unknown(start_app):
    r = requests.get(f"{BASE_URL}/api/v2/ping", timeout=30)
    assert r.status_code == 404, f"GET /api/v2/ping expected 404, got {r.status_code}"
