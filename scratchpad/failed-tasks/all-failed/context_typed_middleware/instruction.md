# Typed Middleware Chain with Extended `ctx` in RedwoodSDK

## Background
RedwoodSDK (`rwsdk`) is a server-first React framework for Cloudflare that exposes a request-scoped, mutable `ctx` object. Middleware functions populate `ctx`, and downstream route handlers, RSCs, and Server Actions read from it. The default `ctx` shape is intentionally permissive; for full type-safety you must extend the framework's `DefaultAppContext` interface through module augmentation. This task asks you to wire up a small but realistic typed middleware chain that attaches per-request user, tenant, and timing metadata to `ctx`, and to expose two JSON routes that consume those fields. The TypeScript compiler must accept your `ctx` usage with strict typing enabled.

A project skeleton scaffolded with `npx create-rwsdk@latest` is already present at `/home/user/myproject`. You will edit it in place.

## Requirements
- Extend `DefaultAppContext` so `ctx` carries the fields described in the Acceptance Criteria.
- Implement three middleware functions in `src/worker.tsx` (or modules imported into it) that populate those fields per request.
- Add two JSON API routes that read from the populated `ctx`.
- The project must continue to type-check under `npx tsc --noEmit` with strict TypeScript enabled.

## Implementation Hints
- Use RedwoodSDK's `defineApp` from `rwsdk/worker` and `route` from `rwsdk/router`.
- Extend `ctx` typing by augmenting the `rwsdk/worker` module's `DefaultAppContext` interface from a `.d.ts` file inside `src/types/`.
- Middleware functions receive `{ request, ctx, ... }`; mutate `ctx` in place. They run before route matching.
- For route shorthands that match on HTTP method, you can pass an object like `{ get: handler }` to `route`.
- Parse the `Authorization` header value `Bearer demo-<role>-<id>` with a strict regex. Reject malformed bearer values by treating them the same as a missing header (`ctx.user = null`).
- Keep `tsconfig.json` strict (`"strict": true`) — do not weaken it to bypass type errors.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- A file `src/types/context.d.ts` exists that augments `rwsdk/worker`'s `DefaultAppContext` to include exactly these fields:
  - `user: { id: string; role: "admin" | "user" } | null`
  - `tenant: { id: string; name: string }`
  - `startedAt: number`
- Middleware behavior (must run in the global `defineApp` middleware chain, before routes):
  - `attachTenant`: reads request header `X-Tenant-Id`. If absent, uses the literal string `tenant-default`. Sets `ctx.tenant = { id, name: ` followed by `Tenant ${id}` `}`.
  - `attachUser`: reads request header `Authorization`. If the value matches `Bearer demo-<role>-<id>` where `<role>` is exactly `admin` or `user` and `<id>` is one or more characters from `[A-Za-z0-9_-]`, then `ctx.user = { id, role }`. Otherwise `ctx.user = null`.
  - `attachTiming`: sets `ctx.startedAt = Date.now()` at the start of the request.
- API routes (return JSON with `Content-Type: application/json`):
  - `GET /api/context`
    - Always returns status 200.
    - Response body shape:
      ```json
      {
        "user": { "id": string, "role": "admin" | "user" } | null,
        "tenant": { "id": string, "name": string },
        "elapsedMs": number
      }
      ```
    - `elapsedMs` MUST be computed as `Date.now() - ctx.startedAt` at response time and MUST be a non-negative integer.
  - `GET /api/admin`
    - When `ctx.user?.role === "admin"`: status 200, body `{ "ok": true }`.
    - Otherwise: status 403, body `{ "error": "forbidden" }`.
- TypeScript: running `npx tsc --noEmit` inside `/home/user/myproject` MUST exit with code 0. The compiler must understand the new `ctx.user`, `ctx.tenant`, and `ctx.startedAt` fields without `any` casts in route handlers or middleware.
- The dev server must be reachable on port 5173 after `npm run dev`.

