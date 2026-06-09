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
# already wires up Vite + rwsdk worker + a basic Document shell, but does
# NOT implement the `/` page, the `/boom` route, the `/api/*` namespace,
# the custom 404 page, the custom 500 page, or the JSON error responses
# required by this task — the agent must add those.
RUN cd /home/user && \
    npx --yes create-rwsdk@latest myproject --force && \
    cd /home/user/myproject && \
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --loglevel=error; else npm install --no-audit --no-fund --loglevel=error; fi

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK task environment: Ubuntu 24.04 + Node.js v24 + pre-scaffolded rwsdk project at /home/user/myproject with npm deps installed. Used to evaluate custom HTML 404 / 500 error pages and JSON-style /api/* error responses."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - pip3 packages: pytest-json-ctrf, requests, pytest-xprocess
#   - Node.js v24 (from deb.nodesource.com)
#   - /home/user/myproject: pre-scaffolded RedwoodSDK project with `npm install`
#     already run; the agent edits this project to implement custom HTML 404 /
#     500 pages, a JSON /api/* namespace with structured 404 / 500 responses,
#     and the throwing routes `/boom` and `/api/boom` used by the verifier.
#   - No browser deps: verification is HTTP-only via the `requests` library.
