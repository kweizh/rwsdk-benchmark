import os
import shutil

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(path), f"{path} does not exist."


def test_package_json_has_dev_script_and_rwsdk():
    import json

    path = os.path.join(PROJECT_DIR, "package.json")
    with open(path) as f:
        pkg = json.load(f)

    scripts = pkg.get("scripts", {})
    assert "dev" in scripts, "package.json scripts must include a 'dev' entry to run the dev server."

    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    assert "rwsdk" in deps, "package.json must declare 'rwsdk' as a dependency."


def test_worker_entry_exists():
    path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(path), f"RedwoodSDK worker entry {path} does not exist."


def test_node_modules_installed():
    path = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(path), (
        "node_modules/rwsdk is missing. Dependencies must be installed in the initial state "
        "so that the dev server can boot offline."
    )


def test_ping_route_not_yet_implemented():
    """The /ping route must NOT exist in the initial state; the agent is expected to add it."""
    path = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    with open(path) as f:
        content = f.read()
    assert "/ping" not in content, (
        "The initial src/worker.tsx must not already contain a '/ping' route; "
        "the executor is expected to add it."
    )
