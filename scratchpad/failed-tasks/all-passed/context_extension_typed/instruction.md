# RedwoodSDK: Typed Context Extension

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Extend the request context (`ctx`) with custom user information populated by a middleware, and surface it via routes.

## Requirements
- Create (or modify) a TypeScript declaration file at `/home/user/myapp/types/app-context.d.ts` (the file path must exactly match) that augments `rwsdk/worker`'s `DefaultAppContext` interface to include at least: `user?: { id: string; role: "admin" | "member" | "guest"; }` and `requestId?: string`.
- Implement a middleware that:
  - Reads the request header `X-User-Id`. If present, populate `ctx.user = { id: <value>, role: <role> }`. The role is derived from the header `X-User-Role` if it equals `admin` or `member`; otherwise default to `"guest"`.
  - Generates a `requestId` (any non-empty string; e.g. UUID or crypto.randomUUID()) and stores it on `ctx.requestId`.
  - Sets the `X-Request-Id` response header to that same value before returning.

## Acceptance Criteria
- Project path: /home/user/myapp
- Required typed declaration file: /home/user/myapp/types/app-context.d.ts
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes (handlers must read `ctx` populated by the middleware):
  - `GET /me` → JSON `{"user": ctx.user ?? null, "requestId": ctx.requestId}` (content-type `application/json`).
  - `GET /me/role` → text body that equals `ctx.user.role` when present, or `anonymous` if no user.
- Every response must include the response header `X-Request-Id` whose value matches the `requestId` returned in `/me`.

