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


def test_search_defaults(start_app):
    r = requests.get(f"{BASE_URL}/search", timeout=30)
    assert r.status_code == 200
    assert r.json() == {"q": "", "tags": [], "page": 1, "limit": 10}


def test_search_full(start_app):
    r = requests.get(
        f"{BASE_URL}/search",
        params=[("q", "hello"), ("tag", "js"), ("tag", "react"), ("page", "3"), ("limit", "25")],
        timeout=30,
    )
    assert r.json() == {"q": "hello", "tags": ["js", "react"], "page": 3, "limit": 25}


def test_search_limit_upper_clamp(start_app):
    r = requests.get(f"{BASE_URL}/search", params={"q": "x", "limit": "999"}, timeout=30)
    assert r.json().get("limit") == 100, f"limit upper clamp failed: {r.json()}"


def test_search_limit_lower_clamp(start_app):
    r = requests.get(f"{BASE_URL}/search", params={"q": "x", "limit": "0"}, timeout=30)
    assert r.json().get("limit") == 1, f"limit lower clamp failed: {r.json()}"


def test_search_page_default(start_app):
    r = requests.get(f"{BASE_URL}/search", params={"q": "x", "page": "abc"}, timeout=30)
    assert r.json().get("page") == 1, f"page default failed: {r.json()}"


def test_echo_first_value(start_app):
    r = requests.get(f"{BASE_URL}/echo", params=[("a", "1"), ("b", "two"), ("a", "2")], timeout=30)
    body = r.json()
    assert body.get("a") == "1", f"echo expected first value of a, got {body}"
    assert body.get("b") == "two", f"echo expected b == 'two', got {body}"
