# RedwoodSDK: Request Logging Middleware

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Implement a custom middleware function inside `defineApp([...])` that records every incoming request, then expose the most recent log entry through an HTTP endpoint.

## Requirements
Insert a middleware that mutates the shared `ctx` (you may also keep an in-memory module-level array) so that for every request it remembers at least:
- `method`: the HTTP method.
- `path`: the pathname of the request URL.
- `userAgent`: the value of the `user-agent` request header (or empty string if missing).

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes:
  - `GET /track/ping` → status 200, body `tracked`.
  - `GET /track/pong` → status 200, body `tracked`.
  - `GET /debug/last` → status 200, `content-type: application/json`. Body is a JSON object containing the **most recent** request's `method`, `path`, and `userAgent` strings.
  - `GET /debug/log` → status 200, `content-type: application/json`. Body is a JSON object `{"count": <int>, "entries": [...]}` where `entries` is an array containing **every** request observed by the middleware (in chronological order), each as `{method, path, userAgent}`. The `count` field must equal `entries.length`.

