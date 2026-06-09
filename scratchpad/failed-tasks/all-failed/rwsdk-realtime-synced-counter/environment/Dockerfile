FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Base OS dependencies, Node.js 24, Python tooling, and browser libraries
# needed to run Chromium via Playwright for real-browser verification.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        curl wget ca-certificates git bash ripgrep \
        python3 python3-pip python3-pytest \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 \
        libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 \
        libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 \
        libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 \
        libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 \
        libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 \
        libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages \
        pytest-json-ctrf \
        pytest-xprocess \
        playwright && \
    python3 -m playwright install --with-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold the baseline RedwoodSDK project at /home/user/myproject using the
# official create-rwsdk CLI, then install its dependencies. The solving agent
# is expected to add the Like counter and the SyncedStateServer wiring; the
# baseline scaffold does NOT contain useSyncedState.
RUN cd /home/user && \
    npx --yes create-rwsdk@latest myproject && \
    cd /home/user/myproject && \
    npm install

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK realtime synced-counter task environment: Node.js 24, baseline rwsdk app at /home/user/myproject, Playwright Chromium for browser verification."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 (for `npm run dev` running the rwsdk Vite worker)
#   - Playwright (Python) + Chromium for browser-based realtime sync verification
#   - pip3 packages used by tests: pytest-xprocess, playwright
#   - /home/user/myproject: baseline RedwoodSDK project scaffolded via `create-rwsdk` with `npm install` already run
