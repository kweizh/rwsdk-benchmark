import hashlib
import os
import socket

import pytest
import requests
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"


SEEDS = [
    {"id": "f1", "name": "alpha.txt", "size": 100, "contentType": "text/plain"},
    {"id": "f2", "name": "beta.png", "size": 2048, "contentType": "image/png"},
    {"id": "f3", "name": "gamma.json", "size": 512, "contentType": "application/json"},
]


def _expected_etag(name: str, size: int) -> str:
    digest = hashlib.sha256(f"{name}:{size}".encode("utf-8")).hexdigest()[:16]
    return f'W/"{size}-{digest}"'


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the RedwoodSDK dev server using xprocess."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    if s.connect_ex(("localhost", APP_PORT)) != 0:
                        return False
                # Any non-connection-error response means the server is up.
                resp = requests.get(f"{BASE_URL}/api/files/f1", timeout=10)
                return resp.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _request(method: str, path: str, **kwargs) -> requests.Response:
    return requests.request(
        method, f"{BASE_URL}{path}", timeout=15, allow_redirects=False, **kwargs
    )


def _allow_methods(resp: requests.Response) -> set:
    allow = resp.headers.get("Allow", "")
    return {m.strip().upper() for m in allow.split(",") if m.strip()}


@pytest.mark.parametrize("seed", SEEDS, ids=[s["id"] for s in SEEDS])
def test_get_valid_id_returns_full_metadata(start_app, seed):
    resp = _request("GET", f"/api/files/{seed['id']}")
    assert resp.status_code == 200, (
        f"GET /api/files/{seed['id']} returned {resp.status_code}, expected 200. "
        f"Body: {resp.text[:500]}"
    )

    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET /api/files/{seed['id']} Content-Type must start with "
        f"'application/json'; got '{ct}'."
    )

    expected_etag = _expected_etag(seed["name"], seed["size"])
    assert resp.headers.get("ETag") == expected_etag, (
        f"GET /api/files/{seed['id']} ETag header expected {expected_etag!r}, "
        f"got {resp.headers.get('ETag')!r}."
    )

    cl_header = resp.headers.get("Content-Length")
    assert cl_header is not None, (
        f"GET /api/files/{seed['id']} must include a Content-Length response header."
    )
    body_bytes = resp.content
    assert int(cl_header) == len(body_bytes), (
        f"GET /api/files/{seed['id']} Content-Length header ({cl_header}) does "
        f"not match actual body byte length ({len(body_bytes)})."
    )

    payload = resp.json()
    assert payload.get("id") == seed["id"], (
        f"GET /api/files/{seed['id']} JSON 'id' expected {seed['id']!r}, got {payload.get('id')!r}."
    )
    assert payload.get("name") == seed["name"], (
        f"GET /api/files/{seed['id']} JSON 'name' expected {seed['name']!r}, got {payload.get('name')!r}."
    )
    assert payload.get("size") == seed["size"], (
        f"GET /api/files/{seed['id']} JSON 'size' expected {seed['size']!r}, got {payload.get('size')!r}."
    )
    assert payload.get("contentType") == seed["contentType"], (
        f"GET /api/files/{seed['id']} JSON 'contentType' expected "
        f"{seed['contentType']!r}, got {payload.get('contentType')!r}."
    )
    assert payload.get("etag") == expected_etag, (
        f"GET /api/files/{seed['id']} JSON 'etag' expected {expected_etag!r}, "
        f"got {payload.get('etag')!r}."
    )


@pytest.mark.parametrize("seed", SEEDS, ids=[s["id"] for s in SEEDS])
def test_head_matches_get_with_empty_body(start_app, seed):
    get_resp = _request("GET", f"/api/files/{seed['id']}")
    assert get_resp.status_code == 200, (
        f"Pre-condition failed: GET /api/files/{seed['id']} status {get_resp.status_code}."
    )
    get_length = len(get_resp.content)
    get_etag = get_resp.headers.get("ETag")
    get_ct = get_resp.headers.get("Content-Type", "")

    head_resp = _request("HEAD", f"/api/files/{seed['id']}")
    assert head_resp.status_code == 200, (
        f"HEAD /api/files/{seed['id']} returned {head_resp.status_code}, expected 200. "
        f"rwsdk does NOT automatically map HEAD to GET; the handler must be defined explicitly."
    )
    assert head_resp.status_code != 405, (
        f"HEAD /api/files/{seed['id']} must NOT return 405."
    )

    head_ct = head_resp.headers.get("Content-Type", "")
    assert head_ct.startswith("application/json"), (
        f"HEAD /api/files/{seed['id']} Content-Type must start with "
        f"'application/json'; got '{head_ct}'."
    )
    assert head_ct == get_ct, (
        f"HEAD /api/files/{seed['id']} Content-Type ({head_ct!r}) must match GET ({get_ct!r})."
    )

    assert head_resp.headers.get("ETag") == get_etag, (
        f"HEAD /api/files/{seed['id']} ETag ({head_resp.headers.get('ETag')!r}) "
        f"must match GET ETag ({get_etag!r})."
    )

    head_cl = head_resp.headers.get("Content-Length")
    assert head_cl is not None, (
        f"HEAD /api/files/{seed['id']} must include a Content-Length response header."
    )
    assert int(head_cl) == get_length, (
        f"HEAD /api/files/{seed['id']} Content-Length ({head_cl}) must equal "
        f"the byte length of the GET body ({get_length})."
    )

    assert head_resp.content == b"", (
        f"HEAD /api/files/{seed['id']} body must be empty; got {len(head_resp.content)} bytes."
    )


@pytest.mark.parametrize("seed", SEEDS, ids=[s["id"] for s in SEEDS])
def test_options_valid_id_returns_204_with_allow(start_app, seed):
    resp = _request("OPTIONS", f"/api/files/{seed['id']}")
    assert resp.status_code == 204, (
        f"OPTIONS /api/files/{seed['id']} returned {resp.status_code}, expected 204."
    )
    allow = _allow_methods(resp)
    for method in ("GET", "HEAD", "OPTIONS"):
        assert method in allow, (
            f"OPTIONS /api/files/{seed['id']} Allow header must list {method}; got {sorted(allow)!r}."
        )
    assert resp.content == b"", (
        f"OPTIONS /api/files/{seed['id']} body must be empty; got {len(resp.content)} bytes."
    )


def test_unknown_id_get_returns_404(start_app):
    resp = _request("GET", "/api/files/does-not-exist")
    assert resp.status_code == 404, (
        f"GET /api/files/does-not-exist must return 404; got {resp.status_code}."
    )


def test_unknown_id_head_returns_404_empty(start_app):
    resp = _request("HEAD", "/api/files/does-not-exist")
    assert resp.status_code == 404, (
        f"HEAD /api/files/does-not-exist must return 404; got {resp.status_code}."
    )
    assert resp.content == b"", (
        f"HEAD 404 body must be empty; got {len(resp.content)} bytes."
    )


def test_unknown_id_options_returns_404(start_app):
    resp = _request("OPTIONS", "/api/files/does-not-exist")
    assert resp.status_code == 404, (
        f"OPTIONS /api/files/does-not-exist must return 404; got {resp.status_code}."
    )


@pytest.mark.parametrize("method", ["POST", "PUT", "DELETE", "PATCH"])
def test_disallowed_methods_return_405_with_allow(start_app, method):
    resp = _request(method, "/api/files/f1")
    assert resp.status_code == 405, (
        f"{method} /api/files/f1 must return 405 Method Not Allowed; got {resp.status_code}."
    )
    allow = _allow_methods(resp)
    for expected in ("GET", "HEAD", "OPTIONS"):
        assert expected in allow, (
            f"{method} 405 response Allow header must include {expected}; got {sorted(allow)!r}."
        )


def test_repeated_requests_are_stable(start_app):
    first_get = _request("GET", "/api/files/f2")
    second_get = _request("GET", "/api/files/f2")
    assert first_get.status_code == 200 and second_get.status_code == 200
    assert first_get.headers.get("ETag") == second_get.headers.get("ETag"), (
        "Repeated GET /api/files/f2 must return the same ETag (state must be stable)."
    )
    assert first_get.headers.get("Content-Length") == second_get.headers.get(
        "Content-Length"
    ), "Repeated GET /api/files/f2 must return the same Content-Length."
    assert first_get.content == second_get.content, (
        "Repeated GET /api/files/f2 must return the same body."
    )

    first_head = _request("HEAD", "/api/files/f2")
    second_head = _request("HEAD", "/api/files/f2")
    assert first_head.status_code == 200 and second_head.status_code == 200
    assert first_head.headers.get("ETag") == second_head.headers.get("ETag")
    assert first_head.headers.get("Content-Length") == second_head.headers.get(
        "Content-Length"
    )
