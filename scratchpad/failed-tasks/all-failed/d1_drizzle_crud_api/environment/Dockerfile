FROM ubuntu:24.04

# ------------------------------------------------------------------------------------
# Base OS, Python, Node.js v24, browser-free verifier deps, and Python test deps.
# ------------------------------------------------------------------------------------
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
        requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# ------------------------------------------------------------------------------------
# Scaffold a RedwoodSDK starter project at /home/user/myproject and pre-install all
# npm dependencies, including Drizzle ORM and drizzle-kit. This keeps the agent task
# focused on writing application code instead of waiting on npm installs.
#
# The RedwoodSDK starter version is pinned to v1.2.11 for reproducibility.
# ------------------------------------------------------------------------------------
ENV CREATE_RWSDK_VERSION=3.1.3
ENV RWSDK_STARTER_RELEASE=v1.2.11
ENV PROJECT_DIR=/home/user/myproject

RUN cd /home/user && \
    npx --yes create-rwsdk@${CREATE_RWSDK_VERSION} myproject --release ${RWSDK_STARTER_RELEASE} --force && \
    cd ${PROJECT_DIR} && \
    npm install --no-audit --no-fund && \
    npm install --no-audit --no-fund drizzle-orm@^0.36.4 && \
    npm install --no-audit --no-fund --save-dev drizzle-kit@^0.30.1

# Best-effort: clear any leftover .wrangler state so the task environment starts
# with a fresh local D1 database.
RUN rm -rf ${PROJECT_DIR}/.wrangler/state || true

LABEL Author="generate-harbor-tasks"
LABEL Description="Ubuntu 24.04 + Node.js v24 + scaffolded RedwoodSDK 1.2.11 starter at /home/user/myproject with rwsdk, drizzle-orm, drizzle-kit, and wrangler pre-installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep build-essential
#   - Node.js v24 (from NodeSource) with global npm
#   - pip3 packages: pytest-json-ctrf, pytest-xprocess, requests
#   - /home/user/myproject: RedwoodSDK starter v1.2.11 with node_modules pre-installed
#       including rwsdk, react, react-dom, @cloudflare/vite-plugin, wrangler,
#       drizzle-orm, and drizzle-kit.
#   - The local miniflare D1 database has NOT been initialized; the task instructs
#     the agent to configure the D1 binding, generate Drizzle migrations, and
#     apply them before starting `npm run dev`.
