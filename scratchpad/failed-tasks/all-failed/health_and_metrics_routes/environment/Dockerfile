FROM ubuntu:24.04

# Base system + Node.js v24 + Python tooling + pip dependencies for the verifier.
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages \
        pytest-json-ctrf \
        pytest-xprocess \
        requests \
        prometheus_client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold a RedwoodSDK project at /home/user/myproject using the official
# create-rwsdk CLI in non-interactive mode. This produces a deterministic,
# known-good baseline matching the upstream starter template. The executor is
# responsible for adding KV + Durable Object bindings to wrangler.jsonc and
# implementing the observability routes/middleware.
RUN cd /home/user && npx --yes create-rwsdk@latest myproject && \
    test -f /home/user/myproject/package.json && \
    test -f /home/user/myproject/wrangler.jsonc && \
    test -f /home/user/myproject/src/worker.tsx

WORKDIR /home/user/myproject

# Pre-install npm dependencies so `npm run dev` starts quickly under miniflare.
RUN npm install --no-audit --no-fund --loglevel=error

WORKDIR /

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK (rwsdk) project scaffold for the health/readiness/metrics observability task. Includes Node.js v24, pre-installed npm deps, and Python tooling (requests, pytest-xprocess, prometheus_client) for verification."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - extra pip3 packages for verification: pytest-xprocess, requests, prometheus_client
#   - Node.js v24 (for the RedwoodSDK / Vite / miniflare dev runtime)
#   - /home/user/myproject: RedwoodSDK minimal starter with npm dependencies pre-installed
