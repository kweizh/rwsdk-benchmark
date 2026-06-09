FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold a starter RedwoodSDK project at /home/user/myproject using
# `create-rwsdk`, then pre-install all npm dependencies so that the agent
# does not need to wait on a fresh install during evaluation. The starter
# already wires up Vite + rwsdk worker + a basic Document, but does NOT
# implement the `/api/files/:id` endpoint, the per-method handlers, the
# seed data, or the HEAD / OPTIONS / 405 behavior required by this task —
# the agent must add those.
RUN cd /home/user && \
    npx --yes create-rwsdk@latest myproject --force && \
    cd /home/user/myproject && \
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --loglevel=error; else npm install --no-audit --no-fund --loglevel=error; fi

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK task environment: Ubuntu 24.04 + Node.js v24 + pre-scaffolded rwsdk project at /home/user/myproject with npm deps installed. Used to evaluate explicit HEAD/OPTIONS/405 method handling on a typed RedwoodSDK route."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - pip3 packages: pytest-json-ctrf, requests, pytest-xprocess
#   - Node.js v24 (from deb.nodesource.com)
#   - /home/user/myproject: pre-scaffolded RedwoodSDK project with `npm install`
#     already run; the agent edits this project to implement
#     `/api/files/:id` with explicit GET, HEAD, OPTIONS and 405 behavior.
#   - No browser deps: verification is HTTP-only via the `requests` library.
