# RedwoodSDK: Auth Interrupter

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Use **interrupters** (handler arrays in `route(...)`) to protect a set of admin routes. Public routes must continue to work without any headers.

## Requirements
Implement an interrupter function (its name does not matter) that:
- Reads the `Authorization` HTTP header from the incoming request.
- If the header is missing or its value is not exactly `Bearer secret-token`, the interrupter must return `new Response("Unauthorized", { status: 401 })`.
- Otherwise, control passes to the next handler.

Use this interrupter to protect every route under `/admin/*`. Implement the routes below.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Public routes (no auth needed):
  - `GET /public/hello` → status 200, body `hello-public`.
- Protected routes (require `Authorization: Bearer secret-token`):
  - `GET /admin/dashboard` → status 200, body `admin-dashboard-ok`.
  - `GET /admin/users` → status 200, JSON body `{"users": ["alice", "bob"]}`.
  - Without a valid `Authorization` header, both routes must return status 401 with body `Unauthorized`.

