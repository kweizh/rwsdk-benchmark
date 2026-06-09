FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm i -g agent-browser && \
    ( agent-browser install || ( apt-get install -y --no-install-recommends chromium-browser || apt-get install -y --no-install-recommends chromium ) ) && \
    pip3 install --break-system-packages pytest-json-ctrf pochi-verifier requests pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold a starter RedwoodSDK project at /home/user/myproject using
# `create-rwsdk`, then pre-install all npm dependencies so that the agent
# does not need to wait on a fresh install during evaluation. The starter
# already wires up Vite + rwsdk worker + a basic Document, but does NOT
# implement the routes, seed data, or `linkFor` helper required by this
# task — the agent must add those.
RUN cd /home/user && \
    npx --yes create-rwsdk@latest myproject --force && \
    cd /home/user/myproject && \
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --loglevel=error; else npm install --no-audit --no-fund --loglevel=error; fi

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK task environment: Ubuntu 24.04 + Node.js v24 + browser verification deps + pre-scaffolded rwsdk project at /home/user/myproject with npm deps installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#                    + browser libs (xcb, gtk, nss, etc.) for agent-browser/Playwright
#   - pip3 packages: pytest-json-ctrf, pochi-verifier, requests, pytest-xprocess
#   - Node.js v24 (from deb.nodesource.com)
#   - agent-browser (npm global) + browsers installed via `agent-browser install`
#   - /home/user/myproject: pre-scaffolded RedwoodSDK project with `npm install`
#     already run; the agent edits this project to implement the typed
#     `linkFor` navigation task.
