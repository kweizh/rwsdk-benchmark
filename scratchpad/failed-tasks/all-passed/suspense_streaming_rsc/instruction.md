# RedwoodSDK: Streaming RSC with Suspense

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Render an async React Server Component wrapped in `<Suspense>` so the streamed HTML response contains the fallback content first, then the resolved content.

## Requirements
- Implement `GET /reports/sales` returning JSX wrapped in `<Suspense fallback={<div>Loading sales report…</div>}>` around an async server component named `SalesReport` (or similar). The async component must `await` a delay of at least 800ms (use `new Promise((res) => setTimeout(res, 800))`) and then render `<div data-testid="report">Sales total: $12,345</div>`.
- Implement `GET /reports/quick` returning JSX wrapped in `<Suspense fallback={<div>Loading quick…</div>}>` around an async component that resolves immediately and renders `<div data-testid="quick">Quick value: 99</div>`.
- Implement `GET /reports/json` (no JSX) returning `application/json` body `{"ok": true}`.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- `GET /reports/sales` final rendered HTML must contain both `Loading sales report…` (suspense fallback marker) and `Sales total: $12,345` (the resolved content). Both markers must appear in the response body (the body is fully streamed by the time `requests` finishes reading).
- `GET /reports/quick` final rendered HTML must contain `Quick value: 99`.
- `GET /reports/json` returns JSON `{"ok": true}` with `content-type: application/json`.

