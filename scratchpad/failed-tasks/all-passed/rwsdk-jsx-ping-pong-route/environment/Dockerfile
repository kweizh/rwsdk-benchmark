FROM ubuntu:24.04

# Base OS packages, Node.js v22 (LTS), and Python test dependencies.
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        build-essential xz-utils && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm@latest && \
    pip3 install --break-system-packages pytest-json-ctrf pytest-xprocess httpx requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold the RedwoodSDK starter project at /home/user/myproject by downloading
# the official starter tarball for a pinned release. We intentionally do NOT add
# the "/ping" route here — the executor is expected to add it.
ENV RWSDK_STARTER_VERSION=v1.2.11
RUN cd /tmp && \
    curl -fsSL "https://github.com/redwoodjs/sdk/releases/download/${RWSDK_STARTER_VERSION}/starter-${RWSDK_STARTER_VERSION}.tar.gz" -o starter.tar.gz && \
    mkdir -p /home/user/myproject && \
    tar -xzf starter.tar.gz -C /home/user/myproject --strip-components=1 && \
    rm starter.tar.gz && \
    # Give the worker a concrete name so wrangler is happy during `vite dev`.
    sed -i 's/__change_me__/rwsdk-ping-pong/g' /home/user/myproject/wrangler.jsonc

# Install Node dependencies up-front so the executor (and the verifier) can boot
# the dev server without any network calls.
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK (rwsdk) starter project at /home/user/myproject with Node.js v22; the agent must add a /ping JSX route."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - additional pip3 packages: pytest-xprocess, httpx, requests (used by the final-state tests)
#   - Node.js v22 (NodeSource) for running `npm run dev` / Vite / wrangler
#   - /home/user/myproject: a RedwoodSDK starter project pinned to v1.2.11 with node_modules pre-installed.
#     The starter does NOT contain a "/ping" route — the executor must add it.
