# RedwoodSDK: Cron Trigger Scheduled Handler

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Wire up a Cloudflare Cron-trigger handler alongside the usual HTTP fetch handler. The RedwoodSDK dev server exposes the scheduled endpoint locally at `/cdn-cgi/handler/scheduled?cron=...` so you can invoke the handler from HTTP calls.

## Requirements
- Update `wrangler.jsonc` to declare three cron schedules: `* * * * *`, `0 * * * *`, `0 21 * * *`.
- Change `src/worker.tsx` so the default export is an `ExportedHandler` object (`{ fetch, scheduled }`) using `defineApp(...)` for `fetch`.
- The `scheduled(controller, env, ctx)` handler must dispatch based on `controller.cron` and append a record `{cron, at}` to a module-level array `cronLog`. After processing it must also `console.log` the value `cron processed: <cron>`.
- Implement `GET /cron/log` to return JSON `{"entries": cronLog}` (the array of records, in order they were appended).
- Implement `GET /cron/clear` to empty the log (status 200, body `cleared`).
- HTTP GET `/cron/ping` returns `pong` (sanity check that fetch still works).

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- `wrangler.jsonc` must contain `"triggers"` with `"crons"` listing all three schedule strings.
- `GET /cron/ping` → 200, body `pong`.
- Triggering scheduled handler locally:
  - `GET /cdn-cgi/handler/scheduled?cron=*+*+*+*+*` → 200.
  - `GET /cdn-cgi/handler/scheduled?cron=0+*+*+*+*` → 200.
- After both scheduled calls, `GET /cron/log` returns JSON whose `entries` array length is 2 and whose entries (in order) have `cron` equal to `* * * * *` and `0 * * * *`.
- `GET /cron/clear` returns body `cleared`. After clearing, `GET /cron/log` returns `entries == []`.

