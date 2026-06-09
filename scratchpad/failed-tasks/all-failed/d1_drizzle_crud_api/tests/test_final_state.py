import os
import socket
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"
API = f"{BASE_URL}/api/books"


@pytest.fixture(scope="session")
def dev_server(xprocess):
    """Start the rwsdk dev server (`npm run dev`) and wait for port 5173."""

    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        # First-time startup of Vite + workerd + miniflare D1 can be slow.
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    if s.connect_ex(("localhost", PORT)) != 0:
                        return False
                # Confirm the rwsdk app actually responds. We don't care about status,
                # only that the server is up and replying to HTTP.
                resp = requests.get(f"{BASE_URL}/api/books", timeout=5)
                return resp.status_code < 600
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    # Give the worker a small additional grace period for first-request warmup.
    time.sleep(2)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _is_json_response(resp):
    ctype = resp.headers.get("Content-Type", "")
    return ctype.lower().startswith("application/json")


def _post_book(title, author):
    return requests.post(
        API,
        json={"title": title, "author": author},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )


def test_list_books_initial(dev_server):
    resp = requests.get(API, timeout=15)
    assert resp.status_code == 200, f"GET /api/books expected 200, got {resp.status_code}: {resp.text}"
    assert _is_json_response(resp), f"GET /api/books expected JSON Content-Type, got {resp.headers.get('Content-Type')}"
    data = resp.json()
    assert isinstance(data, list), f"GET /api/books expected a JSON array, got {type(data).__name__}"


def test_full_crud_flow(dev_server):
    # 1) Create book A
    r_a = _post_book("The Hobbit", "J.R.R. Tolkien")
    assert r_a.status_code == 201, f"POST book A expected 201, got {r_a.status_code}: {r_a.text}"
    assert _is_json_response(r_a), "POST book A response must be JSON."
    a = r_a.json()
    assert isinstance(a, dict), f"POST book A expected object, got {type(a).__name__}"
    for k in ("id", "title", "author", "created_at"):
        assert k in a, f"POST book A response missing field '{k}': {a}"
    assert isinstance(a["id"], int), f"book A id must be an integer, got {a['id']!r}"
    assert a["title"] == "The Hobbit", f"book A title mismatch: {a}"
    assert a["author"] == "J.R.R. Tolkien", f"book A author mismatch: {a}"
    assert a["created_at"] not in (None, "", 0), f"book A created_at must be non-empty: {a}"
    id_a = a["id"]

    # 2) Create book B
    r_b = _post_book("Dune", "Frank Herbert")
    assert r_b.status_code == 201, f"POST book B expected 201, got {r_b.status_code}: {r_b.text}"
    b = r_b.json()
    id_b = b["id"]
    assert isinstance(id_b, int), f"book B id must be integer, got {id_b!r}"
    assert id_b > id_a, f"Expected id_b > id_a ({id_b} > {id_a})"

    # 3) Validation: missing title
    r_bad1 = requests.post(
        API,
        json={"author": "No Title"},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    assert r_bad1.status_code == 400, f"POST missing title expected 400, got {r_bad1.status_code}: {r_bad1.text}"
    assert _is_json_response(r_bad1), "400 response must be JSON."
    body_bad1 = r_bad1.json()
    assert isinstance(body_bad1, dict) and isinstance(body_bad1.get("error"), str) and body_bad1["error"], (
        f"400 response must contain a non-empty `error` string: {body_bad1}"
    )

    # 4) Validation: empty author
    r_bad2 = _post_book("X", "")
    assert r_bad2.status_code == 400, f"POST empty author expected 400, got {r_bad2.status_code}: {r_bad2.text}"
    body_bad2 = r_bad2.json()
    assert isinstance(body_bad2.get("error"), str) and body_bad2["error"], (
        f"400 response must contain a non-empty `error` string: {body_bad2}"
    )

    # 5) List contains both
    r_list = requests.get(API, timeout=15)
    assert r_list.status_code == 200, f"GET /api/books expected 200, got {r_list.status_code}"
    items = r_list.json()
    assert isinstance(items, list), "GET /api/books must return an array."
    ids = [item.get("id") for item in items if isinstance(item, dict)]
    assert id_a in ids, f"Created book A (id={id_a}) not found in list: {ids}"
    assert id_b in ids, f"Created book B (id={id_b}) not found in list: {ids}"
    # Ordered ascending by id (subset check)
    relevant_ids = [i for i in ids if i in (id_a, id_b)]
    assert relevant_ids == sorted(relevant_ids), f"List must be ordered ascending by id, got {relevant_ids}"
    for it in items:
        assert isinstance(it, dict)
        for k in ("id", "title", "author", "created_at"):
            assert k in it, f"List item missing field '{k}': {it}"

    # 6) Get by id
    r_get = requests.get(f"{API}/{id_a}", timeout=15)
    assert r_get.status_code == 200, f"GET /api/books/{id_a} expected 200, got {r_get.status_code}: {r_get.text}"
    got = r_get.json()
    assert got.get("title") == "The Hobbit", f"GET by id wrong title: {got}"
    assert got.get("author") == "J.R.R. Tolkien", f"GET by id wrong author: {got}"
    assert got.get("id") == id_a, f"GET by id wrong id: {got}"

    # 7) Get non-existent
    r_404 = requests.get(f"{API}/999999", timeout=15)
    assert r_404.status_code == 404, f"GET non-existent expected 404, got {r_404.status_code}: {r_404.text}"
    assert _is_json_response(r_404), "404 response must be JSON."
    body_404 = r_404.json()
    assert isinstance(body_404.get("error"), str) and body_404["error"], (
        f"404 response must contain a non-empty `error` string: {body_404}"
    )

    # 8) Update book A
    r_upd = requests.put(
        f"{API}/{id_a}",
        json={"title": "The Hobbit (Revised)"},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    assert r_upd.status_code == 200, f"PUT /api/books/{id_a} expected 200, got {r_upd.status_code}: {r_upd.text}"
    upd = r_upd.json()
    assert upd.get("id") == id_a, f"PUT response id mismatch: {upd}"
    assert upd.get("title") == "The Hobbit (Revised)", f"PUT did not update title: {upd}"
    assert upd.get("author") == "J.R.R. Tolkien", f"PUT must preserve unchanged author: {upd}"

    # 9) Update non-existent
    r_upd_404 = requests.put(
        f"{API}/999999",
        json={"title": "X"},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    assert r_upd_404.status_code == 404, f"PUT non-existent expected 404, got {r_upd_404.status_code}: {r_upd_404.text}"
    body_upd_404 = r_upd_404.json()
    assert isinstance(body_upd_404.get("error"), str) and body_upd_404["error"], (
        f"PUT 404 must contain `error` field: {body_upd_404}"
    )

    # 10) Update with empty body
    r_upd_400 = requests.put(
        f"{API}/{id_b}",
        json={},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    assert r_upd_400.status_code == 400, f"PUT empty body expected 400, got {r_upd_400.status_code}: {r_upd_400.text}"
    body_upd_400 = r_upd_400.json()
    assert isinstance(body_upd_400.get("error"), str) and body_upd_400["error"], (
        f"PUT 400 must contain `error` field: {body_upd_400}"
    )

    # 11) Delete book B
    r_del = requests.delete(f"{API}/{id_b}", timeout=15)
    assert r_del.status_code == 204, f"DELETE /api/books/{id_b} expected 204, got {r_del.status_code}: {r_del.text}"
    assert r_del.text == "" or r_del.text is None, f"DELETE 204 must have empty body, got {r_del.text!r}"

    # 12) Confirm deletion
    r_after = requests.get(f"{API}/{id_b}", timeout=15)
    assert r_after.status_code == 404, (
        f"GET deleted book {id_b} expected 404, got {r_after.status_code}: {r_after.text}"
    )

    # 13) Delete non-existent
    r_del_404 = requests.delete(f"{API}/999999", timeout=15)
    assert r_del_404.status_code == 404, (
        f"DELETE non-existent expected 404, got {r_del_404.status_code}: {r_del_404.text}"
    )
    assert _is_json_response(r_del_404), "DELETE 404 response must be JSON."
    body_del_404 = r_del_404.json()
    assert isinstance(body_del_404.get("error"), str) and body_del_404["error"], (
        f"DELETE 404 must contain `error` field: {body_del_404}"
    )
