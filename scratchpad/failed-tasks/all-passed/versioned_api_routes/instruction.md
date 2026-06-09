# RedwoodSDK Versioned API Routes

## Background
Build a RedwoodSDK (rwsdk) worker application that exposes the same user resource under two API versions (`/v1` and `/v2`). Each version uses its own middleware to advertise an `X-API-Version` response header, and the response payload schema differs per version.

## Requirements
- Implement an HTTP API in a RedwoodSDK app using `defineApp` from `rwsdk/worker`.
- Group the routes for each version using the `prefix()` helper from `rwsdk/router`.
- Both `/v1` and `/v2` mount the same logical resource backed by a single shared in-memory user store.
- For `/v1` responses, return user objects containing only `id` and `name` (no `email`).
- For `/v2` responses, return user objects containing `id`, `name`, and `email`.
- Apply a middleware to all `/v1/*` requests that sets the response header `X-API-Version: 1`.
- Apply a separate middleware to all `/v2/*` requests that sets the response header `X-API-Version: 2`.
- Handle unknown user IDs with HTTP 404 and a JSON body `{"error":"not_found"}`, while still emitting the appropriate `X-API-Version` header.

## Implementation Hints
- Scaffold a new project with `npx create-rwsdk@latest`.
- The `prefix()` helper lets you group routes (and middleware) under a path segment.
- Response headers can be mutated through the `response` object available on `requestInfo` (`response.headers.set(...)`).
- Keep the user store as a plain in-memory array shared by both version handlers; do NOT persist to disk or any database.
- Return JSON responses using `Response.json(...)` or `new Response(JSON.stringify(...), { headers: { 'content-type': 'application/json' } })`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- The dev server must bind to `0.0.0.0` and listen on port 5173 so external HTTP requests can reach it.
- Seeded users (shared by both versions):
  - `{id: "u1", name: "Alice", email: "alice@example.com"}`
  - `{id: "u2", name: "Bob", email: "bob@example.com"}`
  - `{id: "u3", name: "Cyrus", email: "cyrus@example.com"}`
- API endpoints (all responses use `Content-Type: application/json`):
  - `GET /v1/users` → 200, header `X-API-Version: 1`, JSON array of `{id, name}` objects (no `email` field).
  - `GET /v1/users/:id` → 200, header `X-API-Version: 1`, JSON object `{id, name}` (no `email` field). For unknown id, 404 with body `{"error":"not_found"}` and header `X-API-Version: 1`.
  - `GET /v2/users` → 200, header `X-API-Version: 2`, JSON array of `{id, name, email}` objects.
  - `GET /v2/users/:id` → 200, header `X-API-Version: 2`, JSON object `{id, name, email}`. For unknown id, 404 with body `{"error":"not_found"}` and header `X-API-Version: 2`.
- Routes must be grouped using the `prefix()` helper from `rwsdk/router`.
- Both `/v1` and `/v2` must read from the same shared in-memory user store.

