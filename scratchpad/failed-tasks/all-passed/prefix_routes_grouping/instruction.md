# RedwoodSDK: Prefix-Grouped Routes

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Use the `prefix()` helper from `rwsdk/router` to group `/api/v1/*` routes together inside `defineApp([...])`.

## Requirements
Group all v1 API endpoints with a single `prefix("/api/v1", [...])` call.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- The implementation must use `prefix("/api/v1", [...])` once to define the v1 API surface (no string concatenation of `/api/v1` inside individual `route()` calls).
- Endpoints:
  - `GET /api/v1/ping` → status 200, JSON `{"version": "v1", "pong": true}`.
  - `GET /api/v1/echo/:msg` → status 200, JSON `{"version": "v1", "echo": "<msg>"}`.
  - `GET /api/v1/users/:id/profile` → status 200, JSON `{"version": "v1", "userId": "<id>", "profile": true}`.
  - `GET /api/v2/ping` → status 404 (only v1 is implemented).

