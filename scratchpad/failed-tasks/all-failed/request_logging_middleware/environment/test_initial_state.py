import os
import shutil
import subprocess


PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_npx_available():
    assert shutil.which("npx") is not None, "npx binary not found in PATH."


def test_node_version_is_v24():
    result = subprocess.run(
        ["node", "--version"], capture_output=True, text=True, check=True
    )
    version = result.stdout.strip()
    assert version.startswith("v24."), (
        f"Expected Node.js v24.x, got '{version}'."
    )


def test_home_user_dir_exists():
    assert os.path.isdir("/home/user"), "/home/user directory does not exist."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_project_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), f"package.json not found at {pkg}."


def test_project_node_modules_installed():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), (
        f"node_modules directory not found at {nm}; dependencies should be "
        f"pre-installed."
    )


def test_rwsdk_dependency_present():
    nm_rwsdk = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(nm_rwsdk), (
        f"rwsdk package not found in node_modules at {nm_rwsdk}."
    )
