# Real-time Collaborative Whiteboard with RedwoodSDK

## Background
A freshly scaffolded RedwoodSDK (rwsdk) project lives at `/home/user/myproject` with all npm dependencies pre-installed. Turn it into a real-time collaborative whiteboard that synchronizes drawing strokes across every browser viewing the same `boardId`, running locally on Vite + miniflare.

## Requirements
- A page at `/board/:boardId` that shows a clickable drawing surface (a `<canvas>` element or equivalent) and a **Clear** button.
- Each click on the drawing surface adds a coloured dot at the clicked coordinates. The colour of new dots is determined by your implementation (it must be deterministic for the page; any valid CSS colour string is acceptable as long as it round-trips through the JSON API unchanged).
- The list of dots is shared in real time across every browser/tab viewing the same `boardId` using `useSyncedState` from `rwsdk/use-synced-state/client`.
- Clicking **Clear** empties the shared dot list for that board (for every connected client).
- A JSON endpoint at `GET /api/board/:boardId` returns the current dot list for that board.

## Implementation Hints
- Use rwsdk's realtime synced state primitives (`useSyncedState` on the client, `SyncedStateServer` + `syncedStateRoutes` on the worker, plus the matching Durable Object binding and `new_sqlite_classes` migration in `wrangler.jsonc`).
- Scope state per board via the third (room ID) argument to `useSyncedState`, derived from the URL parameter `:boardId`.
- rwsdk is server-first: the `Document` must include `<script type="module" src="/src/client.tsx"></script>` so client components are hydrated and the canvas click handler runs.
- To expose the current dot list over a plain HTTP `GET /api/board/:boardId` endpoint, the worker needs a way to observe synced state updates from outside the React tree. The `SyncedStateServer` exposes server-side hooks for that purpose; consult the rwsdk Realtime docs.
- Treat `:boardId` as an arbitrary opaque string; do not hardcode allowed board IDs.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Start command: `cd /home/user/myproject && npm run dev -- --host 0.0.0.0 --port 5173`
- Port: `5173`
- Routes:
  - `GET /board/:boardId`: Returns `200 OK` HTML containing the whiteboard UI. The page must render:
    - A clickable drawing surface (a `<canvas>` element, or another visible element clearly used for drawing).
    - A clickable element whose visible text contains the word `Clear`.
  - `GET /api/board/:boardId`: Returns `200 OK` with `Content-Type` including `application/json` and a body of shape:
    ```json
    { "dots": [ { "x": number, "y": number, "color": string } ] }
    ```
    The `dots` array must reflect the latest synchronized state for that board, including dots added from any browser tab.
- Real-time behaviour: a click on the drawing surface in one tab viewing `/board/<id>` must add a dot that becomes visible in every other tab viewing the same `/board/<id>` without a manual page refresh, within a few seconds.
- Clear semantics: clicking the **Clear** button on `/board/<id>` must remove every dot for that board for every connected client, and `GET /api/board/<id>` must subsequently return `{ "dots": [] }`.
- Per-board isolation: different `:boardId` values must hold independent dot lists; adding or clearing dots on one board must not affect any other board.
- Verifiers will derive the board ID from the `ZEALT_RUN_ID` environment variable (e.g., `${ZEALT_RUN_ID}-board`). Your implementation must accept arbitrary board IDs via the URL parameter without any pre-registration.
- The `Document` must include a `<script type="module" src="/src/client.tsx">` tag for client hydration. The Durable Object class `SyncedStateServer` must be exported from the worker entry, bound in `wrangler.jsonc`, and migrated via a `new_sqlite_classes` entry.

