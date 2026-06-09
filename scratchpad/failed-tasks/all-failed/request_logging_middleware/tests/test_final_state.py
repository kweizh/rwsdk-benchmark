import json
import os
import re
import socket
import time

import pytest
import requests
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
LOG_PATH = os.path.join(PROJECT_DIR, "logs", "access.log")
CONTEXT_DTS = os.path.join(PROJECT_DIR, "src", "types", "context.d.ts")
APP_PORT = 5173
BASE_URL = f"http://localhost:{APP_PORT}"


UUID_V4_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)


def _clear_log_file():
    """Remove the access log file (if any) so verification sees only its own requests."""
    if os.path.exists(LOG_PATH):
        try:
            os.remove(LOG_PATH)
        except OSError:
            # If we cannot remove it for some reason, truncate to empty so the
            # verifier can still cleanly identify its own log entries by requestId.
            with open(LOG_PATH, "w") as f:
                f.truncate(0)


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the RedwoodSDK dev server via the documented `npm run dev` start command."""
    _clear_log_file()

    class Starter(ProcessStarter):
        name = "rwsdk_dev_server_req_logging"
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
                resp = requests.get(f"{BASE_URL}/api/ping", timeout=10)
                return resp.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _read_log_entries():
    """Read /home/user/myproject/logs/access.log and parse each non-empty line as JSON."""
    assert os.path.isfile(LOG_PATH), (
        f"Access log file not found at {LOG_PATH}. The middleware must append "
        f"one JSON line per request to this exact path."
    )
    with open(LOG_PATH, "r", encoding="utf-8") as f:
        raw = f.read()
    lines = [line for line in raw.split("\n") if line.strip()]
    entries = []
    for idx, line in enumerate(lines):
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError as e:
            raise AssertionError(
                f"Log line {idx + 1} is not valid JSON: {line!r}. Error: {e}"
            )
    return entries


def _find_log_entry(entries, request_id):
    matches = [e for e in entries if isinstance(e, dict) and e.get("requestId") == request_id]
    assert len(matches) == 1, (
        f"Expected exactly one log entry for requestId={request_id!r}; found "
        f"{len(matches)}. All requestIds in log: "
        f"{[e.get('requestId') for e in entries if isinstance(e, dict)]}"
    )
    return matches[0]


def _wait_for_log_entry(request_id, timeout=10.0, poll=0.2):
    """Wait up to `timeout` seconds for the access log to contain `request_id`."""
    deadline = time.time() + timeout
    last_entries = []
    while time.time() < deadline:
        if os.path.isfile(LOG_PATH):
            try:
                last_entries = _read_log_entries()
            except AssertionError:
                last_entries = []
            for e in last_entries:
                if isinstance(e, dict) and e.get("requestId") == request_id:
                    return last_entries
        time.sleep(poll)
    raise AssertionError(
        f"Timed out after {timeout}s waiting for log entry with requestId={request_id!r}. "
        f"Last seen entries: {last_entries}"
    )


# ---------------------------------------------------------------------------
# Static structural checks (src/types/context.d.ts)
# ---------------------------------------------------------------------------


def test_context_dts_file_exists():
    assert os.path.isfile(CONTEXT_DTS), (
        f"Expected TypeScript context augmentation at {CONTEXT_DTS}, but the "
        f"file does not exist."
    )


def test_context_dts_augments_default_app_context_with_request_id():
    with open(CONTEXT_DTS, "r", encoding="utf-8") as f:
        src = f.read()
    assert re.search(r"declare\s+module\s+['\"]rwsdk/worker['\"]", src), (
        f"{CONTEXT_DTS} must contain a `declare module \"rwsdk/worker\"` block "
        f"so DefaultAppContext can be augmented. File contents:\n{src}"
    )
    # Look for `requestId` typed as `string` (allow `?` for optional and any whitespace).
    assert re.search(r"requestId\s*\??\s*:\s*string", src), (
        f"{CONTEXT_DTS} must add a `requestId: string` field to the "
        f"`DefaultAppContext` augmentation. File contents:\n{src}"
    )


# ---------------------------------------------------------------------------
# /api/ping smoke test + X-Request-Id format
# ---------------------------------------------------------------------------


def test_ping_route_returns_pong_and_uuid_v4_header(start_app):
    headers = {"User-Agent": "zealt-verifier/ping"}
    resp = requests.get(f"{BASE_URL}/api/ping", headers=headers, timeout=15)
    assert resp.status_code == 200, (
        f"GET /api/ping must return 200; got {resp.status_code}. Body: {resp.text[:300]}"
    )
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("application/json"), (
        f"GET /api/ping Content-Type must start with 'application/json'; got '{ct}'."
    )
    payload = resp.json()
    assert payload == {"pong": True}, (
        f"GET /api/ping body must equal {{\"pong\": true}}; got {payload!r}."
    )

    rid = resp.headers.get("X-Request-Id")
    assert rid is not None, "Response is missing X-Request-Id header."
    assert UUID_V4_RE.match(rid), (
        f"X-Request-Id must be a canonical lowercase UUID v4; got {rid!r}."
    )

    # Wait for the log entry corresponding to this request.
    _wait_for_log_entry(rid, timeout=10.0)


# ---------------------------------------------------------------------------
# Multiple requests: different methods/paths/User-Agents produce unique ids
# and the log file reflects the same details.
# ---------------------------------------------------------------------------


def test_multiple_requests_unique_request_ids_and_log_lines(start_app):
    # Issue 3 requests with distinct methods, paths and User-Agents.
    requests_to_make = [
        {
            "method": "GET",
            "path": "/",
            "user_agent": "zealt-verifier/root-get",
        },
        {
            "method": "POST",
            "path": "/api/ping",
            "user_agent": "zealt-verifier/post-ping",
        },
        {
            "method": "DELETE",
            "path": "/__zealt/does-not-exist?run=1",
            "user_agent": "zealt-verifier/delete-unknown",
        },
    ]

    results = []
    for spec in requests_to_make:
        headers = {"User-Agent": spec["user_agent"]}
        resp = requests.request(
            spec["method"],
            f"{BASE_URL}{spec['path']}",
            headers=headers,
            timeout=15,
            allow_redirects=False,
        )
        rid = resp.headers.get("X-Request-Id")
        assert rid is not None, (
            f"{spec['method']} {spec['path']} response is missing X-Request-Id header."
        )
        assert UUID_V4_RE.match(rid), (
            f"{spec['method']} {spec['path']} X-Request-Id is not a UUID v4: {rid!r}."
        )
        results.append({"spec": spec, "request_id": rid, "status": resp.status_code})

    # All ids unique.
    ids = [r["request_id"] for r in results]
    assert len(set(ids)) == len(ids), (
        f"X-Request-Id must be unique per request; got duplicates in {ids!r}."
    )

    # Wait for each log entry to flush.
    last_entries = []
    for r in results:
        last_entries = _wait_for_log_entry(r["request_id"], timeout=10.0)

    # Verify each log entry's schema and field values.
    for r in results:
        entry = _find_log_entry(last_entries, r["request_id"])

        # ts: ISO-8601 UTC with T and Z.
        ts = entry.get("ts")
        assert isinstance(ts, str), f"ts must be a string; got {ts!r} in {entry!r}."
        assert "T" in ts and ts.endswith("Z"), (
            f"ts must be ISO-8601 UTC with 'T' and trailing 'Z'; got {ts!r}."
        )

        # method matches request method exactly (uppercase).
        method = entry.get("method")
        assert method == r["spec"]["method"], (
            f"Log entry method expected {r['spec']['method']!r}; got {method!r}."
        )

        # path is pathname only (no query, no scheme/host).
        expected_pathname = r["spec"]["path"].split("?", 1)[0]
        path = entry.get("path")
        assert path == expected_pathname, (
            f"Log entry path expected {expected_pathname!r} (no query string); "
            f"got {path!r}."
        )

        # status: integer matching response status.
        status = entry.get("status")
        assert isinstance(status, int), (
            f"Log entry status must be an integer; got {status!r} (type {type(status).__name__})."
        )
        assert status == r["status"], (
            f"Log entry status {status} must equal response status {r['status']} "
            f"for {r['spec']['method']} {r['spec']['path']}."
        )

        # durationMs: number >= 0.
        duration = entry.get("durationMs")
        assert isinstance(duration, (int, float)) and not isinstance(duration, bool), (
            f"Log entry durationMs must be a number; got {duration!r}."
        )
        assert duration >= 0, f"durationMs must be >= 0; got {duration!r}."

        # requestId matches X-Request-Id header.
        assert entry.get("requestId") == r["request_id"], (
            f"Log entry requestId expected {r['request_id']!r}; got {entry.get('requestId')!r}."
        )

        # userAgent matches the UA we sent.
        ua = entry.get("userAgent")
        assert ua == r["spec"]["user_agent"], (
            f"Log entry userAgent expected {r['spec']['user_agent']!r}; got {ua!r}."
        )


# ---------------------------------------------------------------------------
# Missing User-Agent header => userAgent field is empty string
# ---------------------------------------------------------------------------


def test_missing_user_agent_logs_empty_string(start_app):
    # Use a urllib3 PoolManager to send the request with no User-Agent at all.
    # requests always sets a default UA, so we override it to empty string,
    # which most servers and the spec treat as "no UA".
    headers = {"User-Agent": ""}
    resp = requests.get(f"{BASE_URL}/api/ping", headers=headers, timeout=15)
    assert resp.status_code == 200, (
        f"GET /api/ping (no UA) must return 200; got {resp.status_code}."
    )
    rid = resp.headers.get("X-Request-Id")
    assert rid is not None and UUID_V4_RE.match(rid), (
        f"GET /api/ping (no UA) must include a valid UUID v4 X-Request-Id; got {rid!r}."
    )

    entries = _wait_for_log_entry(rid, timeout=10.0)
    entry = _find_log_entry(entries, rid)
    ua = entry.get("userAgent")
    assert ua == "", (
        f"When the request omits/empties its User-Agent header, the log entry "
        f"userAgent field must be the empty string \"\"; got {ua!r}."
    )
