import json
import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_node_available():
    node_path = shutil.which("node")
    assert node_path is not None, "node binary not found in PATH."
    result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, f"`node --version` failed: {result.stderr}"
    version = result.stdout.strip()
    assert version.startswith("v24."), f"Expected Node.js v24.x, got: {version}"


def test_npm_available():
    npm_path = shutil.which("npm")
    assert npm_path is not None, "npm binary not found in PATH."


def test_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), f"package.json not found at {pkg}."
    with open(pkg) as f:
        data = json.load(f)
    deps = {}
    deps.update(data.get("dependencies", {}))
    deps.update(data.get("devDependencies", {}))
    assert "rwsdk" in deps, "Expected `rwsdk` to be a dependency in package.json."
    assert "drizzle-orm" in deps, "Expected `drizzle-orm` to be a dependency in package.json."
    assert "drizzle-kit" in deps, "Expected `drizzle-kit` to be a dependency in package.json."
    assert "wrangler" in deps, "Expected `wrangler` to be a dependency in package.json."


def test_node_modules_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), f"{node_modules} does not exist; npm dependencies must be pre-installed."
    assert os.path.isdir(os.path.join(node_modules, "rwsdk")), "rwsdk package not installed in node_modules."
    assert os.path.isdir(os.path.join(node_modules, "drizzle-orm")), "drizzle-orm package not installed in node_modules."
    assert os.path.isdir(os.path.join(node_modules, "drizzle-kit")), "drizzle-kit package not installed in node_modules."
    assert os.path.isdir(os.path.join(node_modules, "wrangler")), "wrangler package not installed in node_modules."


def test_worker_entry_present():
    worker = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    assert os.path.isfile(worker), f"Expected rwsdk worker entry file at {worker}."


def test_wrangler_config_present():
    cfg_jsonc = os.path.join(PROJECT_DIR, "wrangler.jsonc")
    cfg_toml = os.path.join(PROJECT_DIR, "wrangler.toml")
    cfg_json = os.path.join(PROJECT_DIR, "wrangler.json")
    assert (
        os.path.isfile(cfg_jsonc) or os.path.isfile(cfg_toml) or os.path.isfile(cfg_json)
    ), "Expected a wrangler config file (wrangler.jsonc/toml/json) at the project root."
