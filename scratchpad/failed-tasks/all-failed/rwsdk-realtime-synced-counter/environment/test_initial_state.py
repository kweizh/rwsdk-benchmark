import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json not found at {pkg_path}."


def test_rwsdk_dependency_declared():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    for k in ("dependencies", "devDependencies"):
        deps.update(pkg.get(k, {}) or {})
    assert "rwsdk" in deps, "rwsdk must be listed as a dependency of the baseline project."


def test_node_modules_installed():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), "node_modules directory missing; dependencies must be installed in the initial environment."
    rwsdk_pkg = os.path.join(nm, "rwsdk", "package.json")
    assert os.path.isfile(rwsdk_pkg), "rwsdk package must be installed under node_modules in the initial environment."


def test_dev_script_present():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {}) or {}
    assert "dev" in scripts, "package.json must define a 'dev' script (e.g. 'npm run dev')."


def test_worker_entry_exists():
    worker_path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(worker_path), f"Expected rwsdk worker entry at {worker_path}."


def test_client_entry_exists():
    client_path = os.path.join(PROJECT_DIR, "src", "client.tsx")
    assert os.path.isfile(client_path), f"Expected client hydration entry at {client_path}."


def test_wrangler_config_exists():
    wrangler_path = os.path.join(PROJECT_DIR, "wrangler.jsonc")
    assert os.path.isfile(wrangler_path), f"Expected wrangler config at {wrangler_path}."


def test_initial_state_has_no_like_counter():
    """The solving agent is responsible for adding the Like counter; the
    baseline project should not already implement useSyncedState."""
    src_dir = os.path.join(PROJECT_DIR, "src")
    offending = []
    for root, _dirs, files in os.walk(src_dir):
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            path = os.path.join(root, name)
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()
            except (OSError, UnicodeDecodeError):
                continue
            if "useSyncedState" in content or "SyncedStateServer" in content:
                offending.append(path)
    assert not offending, (
        "Initial project must not already use rwsdk realtime APIs, but found "
        f"references in: {offending}"
    )
