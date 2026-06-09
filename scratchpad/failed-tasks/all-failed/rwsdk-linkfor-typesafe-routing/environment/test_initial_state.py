import os
import json
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json not found at {pkg_path}."


def test_package_json_declares_rwsdk():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    assert "rwsdk" in deps, "rwsdk dependency not declared in package.json."


def test_package_json_has_dev_script():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {}) or {}
    assert "dev" in scripts, "package.json must define a 'dev' script for running the RedwoodSDK dev server."


def test_worker_entry_exists():
    worker_path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(worker_path), f"Worker entry {worker_path} does not exist."


def test_node_modules_installed():
    nm_path = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(nm_path), (
        "rwsdk does not appear to be installed in node_modules. "
        "Initial state should have dependencies installed."
    )


def test_profile_route_not_yet_present():
    """The /profile/:id route is what the executor must add. It should NOT be present yet."""
    worker_path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    with open(worker_path) as f:
        worker_src = f.read()
    assert "/profile/:id" not in worker_src, (
        "Initial worker.tsx already contains a /profile/:id route; the executor is expected to add it."
    )


def test_home_does_not_yet_link_to_profile():
    """The Home page should NOT yet render a link to /profile/... — the executor must add it."""
    home_path = os.path.join(PROJECT_DIR, "src", "app", "pages", "home.tsx")
    assert os.path.isfile(home_path), f"Expected starter Home page at {home_path}."
    with open(home_path) as f:
        home_src = f.read()
    assert "profile" not in home_src.lower(), (
        "Initial Home page already references a profile route; the executor is expected to add it."
    )
