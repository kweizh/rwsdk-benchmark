FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages \
        pytest-json-ctrf \
        requests \
        pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Pre-create the project directory and pre-install all npm dependencies
# (rwsdk + drizzle-orm/kit + wrangler + vite + react). The package.json
# is intentionally a baseline that the executor will extend (scripts,
# wrangler.jsonc, src/, drizzle.config.ts, schema, migrations, etc.).
RUN mkdir -p /home/user/myproject && \
    cd /home/user/myproject && \
    cat > package.json <<'EOF'
{
  "name": "myproject",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev"
  },
  "dependencies": {
    "rwsdk": "1.2.11",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-server-dom-webpack": "19.2.0",
    "capnweb": "0.5.0",
    "drizzle-orm": "0.45.2"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "1.40.0",
    "@cloudflare/workers-types": "4.20260608.1",
    "drizzle-kit": "0.31.10",
    "typescript": "5.6.3",
    "vite": "6.2.6",
    "wrangler": "4.98.0",
    "@types/react": "19.2.0",
    "@types/react-dom": "19.2.0"
  }
}
EOF

RUN cd /home/user/myproject && npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="RedwoodSDK + Cloudflare D1 + Drizzle ORM environment for the drizzle_migrations_users task."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep nodejs
#   - pip3 packages: pytest-json-ctrf, requests, pytest-xprocess
#   - Node.js v24 via NodeSource for running rwsdk + wrangler (Miniflare local D1)
#   - /home/user/myproject: project skeleton with package.json + node_modules pre-installed
#     (rwsdk, react, react-dom, drizzle-orm, drizzle-kit, wrangler, @cloudflare/vite-plugin, vite, typescript)
