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


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), f"package.json not found at {pkg}."


def test_node_modules_preinstalled():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), (
        f"node_modules directory not found at {nm}. "
        "Dependencies must be pre-installed during image build."
    )


def test_rwsdk_dependency_installed():
    rwsdk_dir = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(rwsdk_dir), (
        f"rwsdk package not found under {rwsdk_dir}. "
        "RedwoodSDK must be installed as a project dependency."
    )


def test_worker_entry_exists():
    worker = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(worker), f"Worker entry {worker} does not exist."


def test_tsconfig_exists():
    tsconfig = os.path.join(PROJECT_DIR, "tsconfig.json")
    assert os.path.isfile(tsconfig), f"tsconfig.json not found at {tsconfig}."


def test_typescript_available_via_npx():
    result = subprocess.run(
        ["npx", "--no-install", "tsc", "--version"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, (
        f"`npx tsc --version` failed in {PROJECT_DIR}. "
        f"stdout={result.stdout!r}, stderr={result.stderr!r}"
    )
