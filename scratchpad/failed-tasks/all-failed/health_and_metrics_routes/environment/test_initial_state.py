import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), f"package.json not found at {pkg}."


def test_package_json_has_rwsdk_dependency():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg) as f:
        data = json.load(f)
    deps = {}
    deps.update(data.get("dependencies", {}) or {})
    deps.update(data.get("devDependencies", {}) or {})
    assert "rwsdk" in deps, "Expected rwsdk to be listed in package.json dependencies."


def test_package_json_has_dev_script():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg) as f:
        data = json.load(f)
    scripts = data.get("scripts", {}) or {}
    assert "dev" in scripts, "Expected a `dev` script in package.json (npm run dev)."


def test_node_modules_installed():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), (
        "node_modules not found in project. Dependencies should be pre-installed."
    )
    rwsdk_dir = os.path.join(nm, "rwsdk")
    assert os.path.isdir(rwsdk_dir), "rwsdk package is not installed in node_modules."


def test_wrangler_config_exists():
    candidates = [
        os.path.join(PROJECT_DIR, "wrangler.jsonc"),
        os.path.join(PROJECT_DIR, "wrangler.json"),
        os.path.join(PROJECT_DIR, "wrangler.toml"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        "Expected a wrangler config (wrangler.jsonc / wrangler.json / wrangler.toml) in the project."
    )


def test_worker_entry_exists():
    candidates = [
        os.path.join(PROJECT_DIR, "src", "worker.tsx"),
        os.path.join(PROJECT_DIR, "src", "worker.ts"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        "Expected an rwsdk worker entry at src/worker.tsx or src/worker.ts."
    )


def test_prometheus_client_importable():
    import prometheus_client  # noqa: F401
    from prometheus_client.parser import text_string_to_metric_families  # noqa: F401
