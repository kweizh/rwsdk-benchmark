import json
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
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json not found at {pkg_path}."


def test_package_json_has_rwsdk_dependency():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    assert "rwsdk" in deps, "rwsdk dependency is missing from package.json."


def test_node_modules_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"node_modules not found at {node_modules}; npm install must run during image build."
    )


def test_rwsdk_module_installed():
    rwsdk_path = os.path.join(PROJECT_DIR, "node_modules", "rwsdk")
    assert os.path.isdir(rwsdk_path), (
        f"rwsdk package is not installed under {rwsdk_path}."
    )


def test_markdown_library_installed():
    marked_path = os.path.join(PROJECT_DIR, "node_modules", "marked")
    markdown_it_path = os.path.join(PROJECT_DIR, "node_modules", "markdown-it")
    assert os.path.isdir(marked_path) or os.path.isdir(markdown_it_path), (
        "Neither 'marked' nor 'markdown-it' is installed in node_modules; "
        "one of them must be available for the executor to render Markdown."
    )


def test_worker_entry_exists():
    worker_tsx = os.path.join(PROJECT_DIR, "src", "worker.tsx")
    worker_ts = os.path.join(PROJECT_DIR, "src", "worker.ts")
    assert os.path.isfile(worker_tsx) or os.path.isfile(worker_ts), (
        "src/worker.tsx (or .ts) not found; scaffold should provide the worker entry."
    )
