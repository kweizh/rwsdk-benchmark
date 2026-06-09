FROM ubuntu:24.04

# Base packages, Python tooling, and Node.js 24 (required by RedwoodSDK / Vite 7 / Wrangler 4).
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf pytest-xprocess requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Standard /home/user workspace.
RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold a baseline RedwoodSDK app at /home/user/myproject using create-rwsdk.
# `create-rwsdk` downloads the latest published starter tarball and is non-interactive
# when a project name is provided. The starter is a minimal app with only `route("/", Home)`
# defined — there is no `/profile/:id` route and no `linkFor` usage yet, matching the
# initial-state expectations of this task.
RUN cd /home/user && \
    npx --yes create-rwsdk myproject --force && \
    cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK baseline scaffold at /home/user/myproject for the linkFor type-safe routing task. Node.js 24 + npm + rwsdk starter installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - pip3 packages required by tests: pytest-xprocess (for long-running dev server), requests (HTTP checks)
#   - Node.js v24 (LTS-class) for running the RedwoodSDK Vite + Wrangler dev server
#   - /home/user: standard user workspace
#   - /home/user/myproject: baseline rwsdk app scaffolded via `npx create-rwsdk` with deps installed,
#       containing only the default `/` route and the default Home page. No `/profile/:id` route
#       and no `linkFor` usage — the executor must add these.
