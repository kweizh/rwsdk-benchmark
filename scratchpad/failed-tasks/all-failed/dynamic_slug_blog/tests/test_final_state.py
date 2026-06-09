import html
import json
import os
import socket

import pytest
import requests
from bs4 import BeautifulSoup
from xprocess import ProcessStarter

from pochi_verifier import PochiVerifier

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:5173"
PORT = 5173

POSTS = [
    {
        "slug": "hello-rwsdk",
        "title": "Hello rwsdk",
        "author": "Ada",
        "body": "# Hello\n\nA simple intro.",
    },
    {
        "slug": "cf-edge-tips",
        "title": "Cloudflare Edge Tips",
        "author": "Bao",
        "body": "# Tips\n\n- Cache wisely\n- Avoid global state",
    },
    {
        "slug": "react-rsc-101",
        "title": "RSC 101",
        "author": "Cyrus",
        "body": "# Server Components\n\nA primer.",
    },
]


def _expected_meta_description(body: str) -> str:
    return html.escape(body[:100], quote=True)


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "rwsdk_dev"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    if s.connect_ex(("localhost", PORT)) != 0:
                        return False
                r = requests.get(BASE_URL + "/", timeout=5)
                return r.status_code == 200
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def browser_verifier():
    yield PochiVerifier()


def test_posts_json_seeded():
    posts_path = os.path.join(PROJECT_DIR, "src", "data", "posts.json")
    assert os.path.isfile(posts_path), (
        f"Expected seed file at {posts_path}; the executor must create src/data/posts.json."
    )
    with open(posts_path) as f:
        data = json.load(f)
    assert isinstance(data, list), "posts.json must contain a JSON array."
    by_slug = {p.get("slug"): p for p in data if isinstance(p, dict)}
    for expected in POSTS:
        slug = expected["slug"]
        assert slug in by_slug, f"Post with slug '{slug}' is missing in posts.json."
        actual = by_slug[slug]
        assert actual.get("title") == expected["title"], (
            f"Post '{slug}' has wrong title: {actual.get('title')!r}, expected {expected['title']!r}."
        )
        assert actual.get("author") == expected["author"], (
            f"Post '{slug}' has wrong author: {actual.get('author')!r}, expected {expected['author']!r}."
        )
        assert actual.get("body") == expected["body"], (
            f"Post '{slug}' has wrong body. Expected: {expected['body']!r}, got: {actual.get('body')!r}."
        )


def test_index_page(start_app):
    r = requests.get(BASE_URL + "/", timeout=30)
    assert r.status_code == 200, f"GET / returned {r.status_code}, expected 200."
    ctype = r.headers.get("Content-Type", "")
    assert ctype.startswith("text/html"), (
        f"GET / Content-Type expected to start with 'text/html', got {ctype!r}."
    )
    body = r.text
    for post in POSTS:
        assert post["title"] in body, (
            f"Index page does not contain title {post['title']!r}."
        )
        assert post["author"] in body, (
            f"Index page does not contain author {post['author']!r}."
        )
    soup = BeautifulSoup(body, "html.parser")
    hrefs = {a.get("href") for a in soup.find_all("a")}
    for post in POSTS:
        expected_href = f"/posts/{post['slug']}"
        assert expected_href in hrefs, (
            f"Index page is missing an anchor with href {expected_href!r}. Found anchors: {sorted(h for h in hrefs if h)}"
        )


@pytest.mark.parametrize("post", POSTS, ids=[p["slug"] for p in POSTS])
def test_detail_page(start_app, post):
    url = f"{BASE_URL}/posts/{post['slug']}"
    r = requests.get(url, timeout=30)
    assert r.status_code == 200, f"GET {url} returned {r.status_code}, expected 200."
    ctype = r.headers.get("Content-Type", "")
    assert ctype.startswith("text/html"), (
        f"Detail page Content-Type expected to start with 'text/html', got {ctype!r}."
    )
    soup = BeautifulSoup(r.text, "html.parser")

    title_el = soup.find("title")
    assert title_el is not None, f"Detail page for {post['slug']} is missing a <title> element."
    assert title_el.get_text(strip=True) == post["title"], (
        f"<title> text for {post['slug']} expected {post['title']!r}, got {title_el.get_text(strip=True)!r}."
    )

    h1_elements = soup.find_all("h1")
    h1_texts = [h.get_text(strip=True) for h in h1_elements]
    assert post["title"] in h1_texts, (
        f"<h1> with text {post['title']!r} not found on detail page for {post['slug']}. Found h1s: {h1_texts}."
    )

    meta_desc = soup.find("meta", attrs={"name": "description"})
    assert meta_desc is not None, (
        f"Detail page for {post['slug']} is missing <meta name=\"description\"> tag."
    )
    content = meta_desc.get("content", "")
    expected = post["body"][:100]
    assert content == expected, (
        f"meta description content for {post['slug']} expected {expected!r}, got {content!r}."
    )


@pytest.mark.parametrize("post", POSTS, ids=[p["slug"] for p in POSTS])
def test_raw_endpoint(start_app, post):
    url = f"{BASE_URL}/posts/{post['slug']}/raw"
    r = requests.get(url, timeout=30)
    assert r.status_code == 200, f"GET {url} returned {r.status_code}, expected 200."
    ctype = r.headers.get("Content-Type", "")
    assert ctype.startswith("text/plain"), (
        f"Raw endpoint Content-Type for {post['slug']} expected to start with 'text/plain', got {ctype!r}."
    )
    assert r.text == post["body"], (
        f"Raw body for {post['slug']} mismatch.\nExpected: {post['body']!r}\nGot: {r.text!r}"
    )


def test_unknown_slug_returns_404(start_app):
    r = requests.get(f"{BASE_URL}/posts/does-not-exist", timeout=30)
    assert r.status_code == 404, (
        f"GET /posts/does-not-exist returned {r.status_code}, expected 404."
    )
    r2 = requests.get(f"{BASE_URL}/posts/does-not-exist/raw", timeout=30)
    assert r2.status_code == 404, (
        f"GET /posts/does-not-exist/raw returned {r2.status_code}, expected 404."
    )


def test_browser_navigation_index_to_detail(start_app, browser_verifier):
    reason = (
        "The blog index page should list all posts and clicking a post link should "
        "navigate the browser to the detail page for that post."
    )
    truth = (
        "Navigate to http://localhost:5173/. Verify that the page lists at least three "
        "post cards including the titles 'Hello rwsdk', 'Cloudflare Edge Tips', and 'RSC 101', "
        "each shown with its author ('Ada', 'Bao', 'Cyrus' respectively). Find the link for "
        "the 'Hello rwsdk' post (anchor href '/posts/hello-rwsdk') and click it. Verify that "
        "the browser navigates to http://localhost:5173/posts/hello-rwsdk, the document title "
        "is exactly 'Hello rwsdk', and the page shows a visible <h1> heading with the text "
        "'Hello rwsdk'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_navigation_index_to_detail",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
