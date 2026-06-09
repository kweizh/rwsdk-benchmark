# RedwoodSDK: Mutating Response Status & Headers via requestInfo

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Use `requestInfo` from `rwsdk/worker` inside JSX-returning routes to control the HTTP status code and response headers without manually constructing a `Response` object.

## Requirements
Implement the routes below under the existing `render(Document, ...)` block (so they return JSX) and use `requestInfo.response.status` / `requestInfo.response.headers.set(...)` to customise the outgoing response.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes:
  - `GET /cached` returns JSX whose rendered HTML contains the text `cached page`, with response headers `Cache-Control: public, max-age=3600` and `X-Cache-Status: HIT`, and status 200.
  - `GET /forbidden` returns JSX whose rendered HTML contains the text `nope!`, with status 403 and the header `X-Reason: forbidden`.
  - `GET /teapot` returns JSX whose rendered HTML contains the text `I am a teapot`, with status 418 and the header `Content-Language: en`.
  - `GET /redirect-me` returns a `Response` with status 302 and `Location: /cached` (no JSX needed).

