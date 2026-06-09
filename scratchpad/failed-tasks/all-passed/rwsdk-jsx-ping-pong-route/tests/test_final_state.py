import os
import re
import socket
import time

import httpx
import pytest
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session")
def dev_server(xprocess):
    """Start the RedwoodSDK (Vite) dev server via `npm run dev` and wait for it to listen."""

    server_env = os.environ.copy()
    # Keep dev server quiet-ish and avoid opening browser
    server_env.setdefault("CI", "1")
    server_env.setdefault("BROWSER", "none")

    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        # NOTE: env / stdout / close_fds must be class attributes, NOT inside popen_kwargs,
        # otherwise Popen raises "got multiple values for keyword argument 'env'".
        env = server_env
        args = ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", str(PORT)]
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("127.0.0.1", PORT)

    xprocess.ensure(Starter.name, Starter)

    # Extra small grace period so Vite finishes initial transform after the port opens.
    deadline = time.time() + 30
    last_err = None
    while time.time() < deadline:
        try:
            r = httpx.get(BASE_URL + "/", timeout=5.0)
            if r.status_code < 500:
                break
        except Exception as e:  # pragma: no cover
            last_err = e
            time.sleep(1.0)
    else:
        if last_err is not None:
            raise RuntimeError(f"Dev server never became reachable: {last_err}")

    yield BASE_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _get(path: str) -> httpx.Response:
    # Use follow_redirects in case the framework normalizes trailing slashes.
    return httpx.get(BASE_URL + path, timeout=30.0, follow_redirects=True)


def test_ping_route_returns_200(dev_server):
    resp = _get("/ping")
    assert resp.status_code == 200, (
        f"GET /ping returned status {resp.status_code}, expected 200. Body: {resp.text[:500]}"
    )


def test_ping_route_returns_html_content_type(dev_server):
    resp = _get("/ping")
    content_type = resp.headers.get("content-type", "")
    assert "text/html" in content_type.lower(), (
        f"GET /ping returned Content-Type '{content_type}', expected to contain 'text/html'."
    )


def test_ping_route_body_is_html_document(dev_server):
    resp = _get("/ping")
    body = resp.text
    assert re.search(r"<html\b", body, re.IGNORECASE), (
        f"GET /ping response body does not look like an HTML document (no <html> tag). "
        f"Body (truncated): {body[:500]}"
    )
    assert re.search(r"<body\b", body, re.IGNORECASE), (
        f"GET /ping response body does not contain a <body> tag. Body (truncated): {body[:500]}"
    )


def test_ping_route_body_contains_pong_in_html_element(dev_server):
    resp = _get("/ping")
    body = resp.text

    # Require "Pong" wrapped inside an HTML element such as <h1>Pong</h1>, <p>Pong</p>, etc.
    pattern = re.compile(
        r"<(h1|h2|h3|h4|h5|h6|p|div|span|strong|em|b|i)\b[^>]*>\s*Pong\s*</\1\s*>",
        re.IGNORECASE,
    )
    assert pattern.search(body), (
        "GET /ping response body must contain the literal text 'Pong' wrapped inside an HTML "
        f"element (e.g. <h1>Pong</h1>). Body (truncated): {body[:800]}"
    )


def test_root_route_still_works(dev_server):
    resp = _get("/")
    assert resp.status_code == 200, (
        f"GET / returned status {resp.status_code}, expected 200 (the original route must keep working)."
    )


def test_worker_source_references_ping_route():
    """Sanity check that the new route was wired in src/worker.tsx (not added via some other mechanism)."""
    path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(path), f"{path} does not exist."
    with open(path) as f:
        content = f.read()
    assert "/ping" in content, (
        "src/worker.tsx must reference the new '/ping' route (the route should be wired in the app definition)."
    )
    assert "route" in content, "src/worker.tsx must use the `route` helper from rwsdk/router."
