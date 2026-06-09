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


def test_layout_files_exist(start_app):
    for p in (
        "/home/user/myapp/src/app/layouts/AppLayout.tsx",
        "/home/user/myapp/src/app/layouts/AdminLayout.tsx",
    ):
        assert os.path.isfile(p), f"Missing layout component file: {p}"


def test_public_home(start_app):
    r = requests.get(f"{BASE_URL}/", timeout=30)
    assert r.status_code == 200
    assert "RedwoodSDK Demo" in r.text, "AppLayout header missing on /"
    assert "© rwsdk demo" in r.text, "AppLayout footer missing on /"
    assert "<h1>Public Home</h1>" in r.text, "Home heading missing on /"
    assert "Admin Sidebar" not in r.text, "Admin layout leaked to /"


def test_about(start_app):
    r = requests.get(f"{BASE_URL}/about", timeout=30)
    assert "RedwoodSDK Demo" in r.text
    assert "<h1>About</h1>" in r.text, "About heading missing"
    assert "Admin Sidebar" not in r.text, "Admin layout leaked to /about"


def test_admin_dashboard(start_app):
    r = requests.get(f"{BASE_URL}/admin/dashboard", timeout=30)
    assert "RedwoodSDK Demo" in r.text, "AppLayout missing on /admin/dashboard"
    assert "Admin Sidebar" in r.text, "AdminLayout sidebar missing"
    assert "<h1>Admin Dashboard</h1>" in r.text, "Admin Dashboard heading missing"


def test_admin_users(start_app):
    r = requests.get(f"{BASE_URL}/admin/users", timeout=30)
    assert "RedwoodSDK Demo" in r.text
    assert "Admin Sidebar" in r.text
    assert "<h1>Admin Users</h1>" in r.text, "Admin Users heading missing"
