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


def test_cached(start_app):
    r = requests.get(f"{BASE_URL}/cached", timeout=30)
    assert r.status_code == 200, f"GET /cached returned {r.status_code}"
    assert "cached page" in r.text
    cc = r.headers.get("Cache-Control", "").lower()
    assert "public" in cc and "max-age=3600" in cc, f"Bad Cache-Control: {cc!r}"
    assert r.headers.get("X-Cache-Status") == "HIT", f"Bad X-Cache-Status: {r.headers}"


def test_forbidden(start_app):
    r = requests.get(f"{BASE_URL}/forbidden", timeout=30)
    assert r.status_code == 403, f"GET /forbidden returned {r.status_code}"
    assert "nope!" in r.text
    assert r.headers.get("X-Reason") == "forbidden", f"Bad X-Reason: {r.headers}"


def test_teapot(start_app):
    r = requests.get(f"{BASE_URL}/teapot", timeout=30)
    assert r.status_code == 418, f"GET /teapot returned {r.status_code}"
    assert "I am a teapot" in r.text
    assert r.headers.get("Content-Language") == "en", f"Bad Content-Language: {r.headers}"


def test_redirect(start_app):
    r = requests.get(f"{BASE_URL}/redirect-me", allow_redirects=False, timeout=30)
    assert r.status_code == 302, f"GET /redirect-me returned {r.status_code}"
    assert r.headers.get("Location") == "/cached", f"Bad Location: {r.headers}"
