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
    assert os.path.isdir(PROJECT_DIR), (
        f"Expected the scaffolded RedwoodSDK project directory at {PROJECT_DIR} to exist."
    )


def test_package_json_exists_and_declares_rwsdk():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), (
        f"package.json is missing at {pkg_path}; the RedwoodSDK starter must already be scaffolded."
    )
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    deps = {}
    for k in ("dependencies", "devDependencies", "peerDependencies"):
        v = pkg.get(k)
        if isinstance(v, dict):
            deps.update(v)
    assert "rwsdk" in deps, (
        "Expected the scaffolded project's package.json to declare 'rwsdk' as a dependency, "
        "but it was not found in dependencies/devDependencies."
    )


def test_dev_script_present():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {}) or {}
    assert "dev" in scripts, (
        "Expected the scaffolded project's package.json to expose an 'npm run dev' script."
    )


def test_node_modules_installed():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), (
        f"Expected dependencies to be pre-installed at {nm} so that 'npm run dev' starts quickly."
    )


def test_rwsdk_node_module_present():
    rwsdk_dir = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(rwsdk_dir), (
        f"Expected the rwsdk package to be installed at {rwsdk_dir}."
    )
