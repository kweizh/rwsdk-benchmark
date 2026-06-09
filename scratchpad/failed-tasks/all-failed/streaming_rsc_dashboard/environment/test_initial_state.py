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
    deps.update(data.get("dependencies") or {})
    deps.update(data.get("devDependencies") or {})
    assert "rwsdk" in deps, "Expected the 'rwsdk' dependency to be declared in package.json."


def test_package_json_has_dev_script():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg) as f:
        data = json.load(f)
    scripts = data.get("scripts") or {}
    assert "dev" in scripts, "Expected the 'dev' script to be defined in package.json."


def test_worker_entry_exists():
    worker = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(worker), f"Worker entry {worker} does not exist."


def test_node_modules_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"node_modules directory not found at {node_modules}; dependencies should be pre-installed."
    )


def test_rwsdk_module_installed():
    rwsdk_dir = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(rwsdk_dir), (
        f"rwsdk package not found at {rwsdk_dir}; it should be pre-installed."
    )
