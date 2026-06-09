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


def test_sales_suspense(start_app):
    r = requests.get(f"{BASE_URL}/reports/sales", timeout=60)
    assert r.status_code == 200, f"GET /reports/sales status {r.status_code}"
    assert "Loading sales report" in r.text, \
        f"Expected Suspense fallback marker in body: {r.text[:600]}"
    assert "Sales total: $12,345" in r.text, \
        f"Expected resolved content in body: {r.text[:600]}"


def test_quick_suspense(start_app):
    r = requests.get(f"{BASE_URL}/reports/quick", timeout=30)
    assert r.status_code == 200
    assert "Quick value: 99" in r.text, f"Resolved quick value missing: {r.text[:500]}"


def test_reports_json(start_app):
    r = requests.get(f"{BASE_URL}/reports/json", timeout=30)
    assert r.status_code == 200
    assert "application/json" in r.headers.get("content-type", "").lower()
    assert r.json() == {"ok": True}
