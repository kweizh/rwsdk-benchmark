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


def test_home(start_app):
    r = requests.get(f"{BASE_URL}/", timeout=30)
    assert r.status_code == 200
    body = r.text
    assert "<title>Home — rwsdk</title>" in body, "Home <title> missing"
    assert "Welcome to the rwsdk demo home page." in body, "Home description missing"
    assert "<h1>Home</h1>" in body


def test_about(start_app):
    r = requests.get(f"{BASE_URL}/about", timeout=30)
    assert r.status_code == 200
    body = r.text
    assert "<title>About — rwsdk</title>" in body, "About <title> missing"
    assert "Learn more about the rwsdk demo." in body
    assert "<h1>About</h1>" in body


def test_docs(start_app):
    r = requests.get(f"{BASE_URL}/docs", timeout=30)
    assert r.status_code == 200
    body = r.text
    assert "<title>Docs — rwsdk</title>" in body
    assert "Docs for the rwsdk demo." in body
    assert "/og/docs.png" in body
    assert "<h1>Docs</h1>" in body
