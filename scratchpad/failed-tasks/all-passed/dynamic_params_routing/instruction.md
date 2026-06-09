# RedwoodSDK: Dynamic Parameters & Wildcards

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Implement routes that use parameter segments and wildcard patterns supported by the `rwsdk/router` package, and respond with `application/json` payloads derived from the parsed parameters.

## Requirements
Add the routes listed below to the existing `defineApp([...])` call. Each route must return a `Response` whose body is JSON (`content-type: application/json`).

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes (all GET):
  - `/users/:id` → `{"id": "<id>"}`
  - `/users/:id/posts/:postId` → `{"userId": "<id>", "postId": "<postId>"}`
  - `/teams/:teamId/members/:memberId/role` → `{"teamId": "<teamId>", "memberId": "<memberId>", "resource": "role"}`
  - `/files/*` → `{"path": "<wildcard match>"}` where `<wildcard match>` is the substring after `/files/`.
  - `/files/*/download/*` → `{"prefix": "<first wildcard>", "suffix": "<second wildcard>"}`
- All responses must use `Content-Type: application/json`.

