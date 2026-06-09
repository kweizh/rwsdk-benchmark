import os
import re
import socket
import time

import pytest
import requests
from prometheus_client.parser import text_string_to_metric_families
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:5173"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _http_ready(url: str) -> bool:
    try:
        r = requests.get(url, timeout=2)
        return r.status_code < 500
    except Exception:
        return False


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
            if not _port_open("localhost", 5173):
                return False
            # Make sure the worker is actually responding, not just Vite listening.
            return _http_ready(f"{BASE_URL}/healthz")

    xprocess.ensure(Starter.name, Starter)

    # Give the worker a moment to settle.
    deadline = time.time() + 30
    while time.time() < deadline:
        if _http_ready(f"{BASE_URL}/healthz"):
            break
        time.sleep(0.5)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_healthz_returns_ok(start_app):
    r = requests.get(f"{BASE_URL}/healthz", timeout=10)
    assert r.status_code == 200, f"/healthz expected 200, got {r.status_code}: {r.text!r}"
    ct = r.headers.get("Content-Type", "")
    assert ct.lower().startswith("application/json"), (
        f"/healthz expected application/json content-type, got {ct!r}"
    )
    body = r.json()
    assert body.get("status") == "ok", f"/healthz expected status=ok, got {body!r}"
    assert body.get("version") == "1.0.0", f"/healthz expected version='1.0.0', got {body!r}"
    uptime = body.get("uptimeSec")
    assert isinstance(uptime, (int, float)) and uptime >= 0, (
        f"/healthz expected non-negative numeric uptimeSec, got {uptime!r}"
    )


def test_readyz_returns_ready(start_app):
    r = requests.get(f"{BASE_URL}/readyz", timeout=10)
    assert r.status_code == 200, (
        f"/readyz expected 200 on happy path, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert body.get("ready") is True, f"/readyz expected ready=true, got {body!r}"
    checks = body.get("checks") or {}
    assert checks.get("kv") == "ok", f"/readyz expected checks.kv == 'ok', got {checks!r}"
    assert checks.get("durableObject") == "ok", (
        f"/readyz expected checks.durableObject == 'ok', got {checks!r}"
    )


def test_seed_counters_and_metrics(start_app):
    # Seed counter activity
    for _ in range(3):
        r = requests.get(f"{BASE_URL}/healthz", timeout=10)
        assert r.status_code == 200
    for _ in range(2):
        r = requests.get(f"{BASE_URL}/readyz", timeout=10)
        assert r.status_code == 200
    # Hit an unknown route to seed a non-2xx in the counter.
    miss = requests.get(f"{BASE_URL}/this-route-should-not-exist", timeout=10)
    assert miss.status_code >= 400, (
        f"Unknown route should not return 2xx, got {miss.status_code}"
    )

    # Now scrape /metrics
    r = requests.get(f"{BASE_URL}/metrics", timeout=10)
    assert r.status_code == 200, (
        f"/metrics expected 200, got {r.status_code}: {r.text!r}"
    )

    ct = r.headers.get("Content-Type", "")
    # Required: text/plain; version=0.0.4 ; charset is optional
    assert re.search(r"^text/plain\s*;\s*version=0\.0\.4(\s*;\s*charset=[\w-]+)?\s*$",
                     ct, re.IGNORECASE), (
        f"/metrics expected Content-Type 'text/plain; version=0.0.4', got {ct!r}"
    )

    body = r.text

    # Parse with prometheus_client
    families = list(text_string_to_metric_families(body))
    family_names = {f.name for f in families}
    assert "app_requests_total" in family_names or "app_requests" in family_names, (
        f"Expected counter family app_requests_total in metrics. Got: {family_names}. Body: {body!r}"
    )
    assert "app_request_duration_seconds" in family_names, (
        f"Expected histogram family app_request_duration_seconds. Got: {family_names}. Body: {body!r}"
    )

    # Find counter family. prometheus_client strips the `_total` suffix to produce the family name.
    counter_family = next(
        (f for f in families if f.name in ("app_requests_total", "app_requests")),
        None,
    )
    assert counter_family is not None and counter_family.type == "counter", (
        f"app_requests_total must be of TYPE counter, got family {counter_family!r}"
    )

    # Check labels and counts
    counter_samples = list(counter_family.samples)
    required_labels = {"path", "method", "status"}
    for s in counter_samples:
        # Only inspect _total samples (the counter values), not _created.
        if not s.name.endswith("_total") and s.name not in ("app_requests_total", "app_requests"):
            continue
        missing = required_labels - set(s.labels.keys())
        assert not missing, (
            f"counter sample {s.name} missing labels {missing}; got labels {s.labels}"
        )

    def counter_sum_for(path_value: str, method_value: str = "GET") -> float:
        total = 0.0
        for s in counter_samples:
            if s.name not in ("app_requests_total", "app_requests"):
                continue
            if s.labels.get("path") == path_value and s.labels.get("method") == method_value:
                total += s.value
        return total

    healthz_count = counter_sum_for("/healthz")
    readyz_count = counter_sum_for("/readyz")
    assert healthz_count >= 3, (
        f"Expected app_requests_total for /healthz GET >= 3, got {healthz_count}. "
        f"All counter samples: {counter_samples}"
    )
    assert readyz_count >= 2, (
        f"Expected app_requests_total for /readyz GET >= 2, got {readyz_count}. "
        f"All counter samples: {counter_samples}"
    )

    # Ensure at least one non-2xx status was recorded
    has_4xx = any(
        (s.labels.get("status", "") or "").startswith("4")
        for s in counter_samples
        if s.name in ("app_requests_total", "app_requests")
    )
    assert has_4xx, (
        f"Expected at least one counter sample with status label starting with '4'. "
        f"Got samples: {counter_samples}"
    )

    # Histogram checks
    hist_family = next(
        (f for f in families if f.name == "app_request_duration_seconds"),
        None,
    )
    assert hist_family is not None and hist_family.type == "histogram", (
        f"app_request_duration_seconds must be of TYPE histogram"
    )

    expected_buckets = {"0.005", "0.01", "0.025", "0.05", "0.1", "0.25", "0.5",
                        "1.0", "2.5", "5.0", "10.0", "+Inf"}
    seen_buckets = set()
    bucket_samples = []
    count_samples = []
    for s in hist_family.samples:
        if s.name == "app_request_duration_seconds_bucket":
            bucket_samples.append(s)
            seen_buckets.add(s.labels.get("le", ""))
        elif s.name == "app_request_duration_seconds_count":
            count_samples.append(s)

    assert expected_buckets.issubset(seen_buckets), (
        f"Histogram missing expected buckets. "
        f"Expected superset of {expected_buckets}, got {seen_buckets}."
    )

    total_count = sum(s.value for s in count_samples)
    assert total_count >= 6, (
        f"Expected at least 6 observations in histogram _count, got {total_count}. "
        f"Body: {body!r}"
    )

    # For each labelset, +Inf bucket value should equal _count.
    def labelset_key(labels):
        return tuple(sorted((k, v) for k, v in labels.items() if k != "le"))

    inf_for_labelset = {}
    for s in bucket_samples:
        if s.labels.get("le") == "+Inf":
            inf_for_labelset[labelset_key(s.labels)] = s.value
    for s in count_samples:
        key = labelset_key(s.labels)
        if key in inf_for_labelset:
            assert inf_for_labelset[key] == s.value, (
                f"Histogram +Inf bucket {inf_for_labelset[key]} != count {s.value} "
                f"for labels {s.labels}"
            )


def test_metrics_has_help_and_type_lines(start_app):
    r = requests.get(f"{BASE_URL}/metrics", timeout=10)
    assert r.status_code == 200
    body = r.text
    assert re.search(r"^#\s*HELP\s+app_requests_total\b", body, re.MULTILINE), (
        f"/metrics body missing '# HELP app_requests_total' line. Body: {body!r}"
    )
    assert re.search(r"^#\s*TYPE\s+app_requests_total\s+counter\b", body, re.MULTILINE), (
        f"/metrics body missing '# TYPE app_requests_total counter' line. Body: {body!r}"
    )
    assert re.search(r"^#\s*HELP\s+app_request_duration_seconds\b", body, re.MULTILINE), (
        f"/metrics body missing '# HELP app_request_duration_seconds' line. Body: {body!r}"
    )
    assert re.search(r"^#\s*TYPE\s+app_request_duration_seconds\s+histogram\b",
                     body, re.MULTILINE), (
        f"/metrics body missing '# TYPE app_request_duration_seconds histogram' line. Body: {body!r}"
    )
