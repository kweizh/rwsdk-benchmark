Cloudflare Workers support scheduled events (Cron Triggers) alongside standard web requests, but integrating these with a high-level React framework requires specific export structuring.

You need to modify the root export of `src/worker.tsx` to handle standard web traffic via the `defineApp` router, while simultaneously exposing a `scheduled` handler for periodic background data cleanup. 

**Constraints:**
- The default export must be an object containing both `fetch` (handling the `defineApp` logic) and `scheduled` methods.
- The `scheduled` method must successfully execute a `console.log("Running cleanup")` statement.
- Do NOT modify or break any existing route definitions currently provided to `defineApp`.