import os
import re
import socket
import pytest
import requests
from xprocess import ProcessStarter
from pochi_verifier import PochiVerifier


PROJECT_DIR = "/home/user/myproject"
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"


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
                resp = requests.get(f"{BASE_URL}/", timeout=5)
                return resp.status_code == 200
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def browser_verifier():
    return PochiVerifier()


def _get(path: str) -> requests.Response:
    return requests.get(f"{BASE_URL}{path}", timeout=15)


def test_home_page_lists_users_with_typed_links(start_app):
    resp = _get("/")
    assert resp.status_code == 200, (
        f"GET / returned {resp.status_code}, expected 200."
    )
    body = resp.text
    for user_id in ("1", "2", "3"):
        assert f'href="/users/{user_id}"' in body, (
            f"Home page HTML must contain link href=\"/users/{user_id}\". "
            f"Got body:\n{body[:2000]}"
        )
    for name in ("Ada", "Bao", "Cyrus"):
        assert name in body, (
            f"Home page must render the seed user name '{name}'. "
            f"Got body:\n{body[:2000]}"
        )


def test_users_index_page_lists_all_users(start_app):
    resp = _get("/users")
    assert resp.status_code == 200, (
        f"GET /users returned {resp.status_code}, expected 200."
    )
    body = resp.text
    for user_id in ("1", "2", "3"):
        assert f'href="/users/{user_id}"' in body, (
            f"/users page must contain link href=\"/users/{user_id}\". "
            f"Got body:\n{body[:2000]}"
        )


def test_user_detail_page_lists_posts(start_app):
    resp = _get("/users/1")
    assert resp.status_code == 200, (
        f"GET /users/1 returned {resp.status_code}, expected 200."
    )
    body = resp.text
    assert "Ada" in body, (
        f"/users/1 must render user name 'Ada'. Got body:\n{body[:2000]}"
    )
    for post_id in ("p1", "p2"):
        assert f'href="/users/1/posts/{post_id}"' in body, (
            f"/users/1 must contain link href=\"/users/1/posts/{post_id}\". "
            f"Got body:\n{body[:2000]}"
        )


def test_user_detail_page_for_other_user(start_app):
    resp = _get("/users/2")
    assert resp.status_code == 200
    body = resp.text
    assert "Bao" in body, (
        f"/users/2 must render user name 'Bao'. Got body:\n{body[:2000]}"
    )
    for post_id in ("p1", "p2"):
        assert f'href="/users/2/posts/{post_id}"' in body, (
            f"/users/2 must contain link href=\"/users/2/posts/{post_id}\". "
            f"Got body:\n{body[:2000]}"
        )


def test_post_detail_renders_params_and_back_link(start_app):
    resp = _get("/users/1/posts/p1")
    assert resp.status_code == 200, (
        f"GET /users/1/posts/p1 returned {resp.status_code}, expected 200."
    )
    body = resp.text
    assert "1" in body, "/users/1/posts/p1 must render user id '1' somewhere."
    assert "p1" in body, "/users/1/posts/p1 must render post id 'p1' somewhere."
    assert 'href="/users/1"' in body, (
        f"/users/1/posts/p1 must contain back link href=\"/users/1\". "
        f"Got body:\n{body[:2000]}"
    )


def test_post_detail_for_other_combination(start_app):
    resp = _get("/users/3/posts/p2")
    assert resp.status_code == 200
    body = resp.text
    assert "3" in body, "/users/3/posts/p2 must render user id '3'."
    assert "p2" in body, "/users/3/posts/p2 must render post id 'p2'."
    assert 'href="/users/3"' in body, (
        "/users/3/posts/p2 must contain back link href=\"/users/3\". "
        f"Got body:\n{body[:2000]}"
    )


def test_shared_link_module_uses_linkfor():
    """The project must expose a shared module that derives `link` from
    `linkFor<App>()` rather than hardcoding URL strings."""
    candidates = []
    src_root = os.path.join(PROJECT_DIR, "src")
    for root, _, files in os.walk(src_root):
        for fname in files:
            if fname.endswith((".ts", ".tsx", ".js", ".jsx")):
                candidates.append(os.path.join(root, fname))

    matching = []
    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except (OSError, UnicodeDecodeError):
            continue
        if "linkFor" in content and "rwsdk/router" in content:
            matching.append(path)

    assert matching, (
        "No source file imports `linkFor` from `rwsdk/router`. "
        "The task requires a shared module that does "
        "`import { linkFor } from \"rwsdk/router\"` and exports a typed `link` helper."
    )

    found_link_export = False
    for path in matching:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        # Must call linkFor with an App type and export a link helper.
        if re.search(r"linkFor\s*<", content) and re.search(
            r"export\s+(const|let|var)\s+link\b", content
        ):
            found_link_export = True
            break

    assert found_link_export, (
        "No source file calls `linkFor<App>()` and exports a `link` helper. "
        "The task requires the pattern: "
        "`export const link = linkFor<App>();` in a shared module."
    )


def test_no_hardcoded_user_route_strings_in_pages():
    """Page components must not hardcode `/users/...` strings inside JSX href
    attributes; they must use the `link()` helper instead."""
    src_root = os.path.join(PROJECT_DIR, "src")
    bad_patterns = [
        re.compile(r'href\s*=\s*[\"\']/users/'),
        re.compile(r'href\s*=\s*\{\s*[\"\']/users/'),
    ]
    offenders = []
    for root, _, files in os.walk(src_root):
        # Ignore the shared links module itself; restrict to page files.
        for fname in files:
            if not fname.endswith((".tsx", ".jsx")):
                continue
            path = os.path.join(root, fname)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
            except (OSError, UnicodeDecodeError):
                continue
            # Allow the worker file (which defines routes with literal patterns).
            if os.path.basename(path) == "worker.tsx":
                continue
            for pat in bad_patterns:
                if pat.search(content):
                    offenders.append(path)
                    break

    assert not offenders, (
        "Page components must not hardcode `/users/...` literal href strings; "
        "use the `link(...)` helper produced by `linkFor<App>()`. Offending "
        f"files: {offenders}"
    )


def test_browser_navigation_with_linkfor(start_app, browser_verifier):
    reason = (
        "The app must use rwsdk's `linkFor` helper for type-safe navigation. "
        "From the home page, clicking a user link should navigate to that user's "
        "detail page; clicking a post link should navigate to the post detail "
        "page; and the back link on the post page should return to the user page."
    )
    truth = (
        "Open http://localhost:5173/. Verify the page contains at least one "
        "anchor whose href matches the regex ^/users/(1|2|3)$. Click the first "
        "such anchor. After navigation, the URL must match the regex "
        "^http://localhost:5173/users/(1|2|3)$ and the page must render two "
        "anchors whose hrefs match ^/users/\\\\d+/posts/(p1|p2)$. Click the "
        "first post link. After navigation, the URL must match "
        "^http://localhost:5173/users/(1|2|3)/posts/(p1|p2)$ and the page body "
        "must contain both the user id and post id from the URL. Then click "
        "the back link (href matching ^/users/(1|2|3)$). After navigation, "
        "the URL must again match ^http://localhost:5173/users/(1|2|3)$."
    )

    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_navigation_with_linkfor",
    )
    assert result.status == "pass", (
        f"Browser verification failed: {result.reason}"
    )
