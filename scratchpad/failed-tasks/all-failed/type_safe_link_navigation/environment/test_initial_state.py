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


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_home_user_dir_exists():
    assert os.path.isdir("/home/user"), "/home/user directory does not exist."
