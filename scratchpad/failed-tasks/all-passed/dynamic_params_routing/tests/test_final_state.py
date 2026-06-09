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


def _get_json(path: str):
    r = requests.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"GET {path} returned {r.status_code}: {r.text[:300]}"
    ct = r.headers.get("content-type", "").lower()
    assert "application/json" in ct, f"Expected JSON content-type for {path}, got: {ct}"
    return r.json()


def test_single_param(start_app):
    assert _get_json("/users/abc") == {"id": "abc"}


def test_two_params(start_app):
    assert _get_json("/users/42/posts/hello") == {"userId": "42", "postId": "hello"}


def test_three_segment_param(start_app):
    assert _get_json("/teams/redwood/members/alice/role") == {
        "teamId": "redwood",
        "memberId": "alice",
        "resource": "role",
    }


def test_wildcard_path(start_app):
    data = _get_json("/files/photos/2024/cat.png")
    assert data.get("path") == "photos/2024/cat.png", f"Unexpected wildcard payload: {data}"


def test_double_wildcard(start_app):
    data = _get_json("/files/docs/intro/download/v2/final.pdf")
    assert data.get("prefix") == "docs/intro", f"Unexpected prefix: {data}"
    assert data.get("suffix") == "v2/final.pdf", f"Unexpected suffix: {data}"
