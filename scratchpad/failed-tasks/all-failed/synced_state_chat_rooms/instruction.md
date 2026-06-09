# RedwoodSDK: Multi-Room Realtime Chat

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Build a chat application whose room IDs are taken from the URL path and whose chat messages are kept in real-time sync per room using `useSyncedState` with a room scope.

## Requirements
- Update `wrangler.jsonc` to register the `SyncedStateServer` Durable Object under the binding name `SYNCED_STATE_SERVER` (with the required SQLite migration including `"new_sqlite_classes": ["SyncedStateServer"]`).
- In `src/worker.tsx`, re-export `SyncedStateServer` and register `syncedStateRoutes(() => env.SYNCED_STATE_SERVER)` inside `defineApp([...])`.
- Create a client component at `src/app/components/ChatRoom.tsx` (`"use client"`) that accepts a `roomId` prop and calls `useSyncedState<string[]>([], "messages", roomId)`. It must render:
  - A scrollable list where each message appears inside an element with attribute `data-testid="chat-message"`.
  - An `<input data-testid="chat-input" type="text" />` for typing.
  - A `<button data-testid="send-btn">Send</button>` button that appends the input's value to the synced array (and clears the input).
  - A `<button data-testid="clear-btn">Clear</button>` button that resets messages to `[]`.
- Implement `GET /chat/:roomId` as a server route that renders a page including `<h1>Room: <roomId></h1>` and the `ChatRoom` client component with the `roomId` parameter from the URL.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- `wrangler.jsonc` contains the `SYNCED_STATE_SERVER` durable object binding and the `SyncedStateServer` SQLite migration.
- `GET /chat/general` returns HTML containing `<h1>Room: general</h1>` and the visible label `Send`.
- `GET /chat/redwood` returns HTML containing `<h1>Room: redwood</h1>`.
- Browser verification on http://localhost:5173/chat/general: after clicking `Clear`, typing `hello redwood`, clicking `Send`, the message text `hello redwood` appears inside a `data-testid="chat-message"` element. Then on http://localhost:5173/chat/other, after clicking `Clear`, no chat message with text `hello redwood` is visible (state is room-scoped).

