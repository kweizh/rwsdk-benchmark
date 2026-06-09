# Multi-Room Chat with RedwoodSDK

## Background
Build a multi-room realtime chat application on top of the RedwoodSDK starter project. Each chat room is identified by an ID embedded in the URL, and the message history of every room must be isolated from other rooms and must survive page reloads within the running dev server.

## Requirements
A RedwoodSDK starter project has already been scaffolded at `/home/user/myproject` (with dependencies installed). Extend it so that:

- A route at `/chat/:roomId` renders a chat UI for the given room.
- The UI lets a user submit text messages and shows the room's full message history.
- Different room IDs hold independent message streams.
- Previously submitted messages remain visible after reloading the same room URL (within the same dev-server lifetime).

## Implementation Hints
- Use RedwoodSDK's realtime synced state primitive (the `useSyncedState` hook from `rwsdk/use-synced-state/client` and the `SyncedStateServer` Durable Object from `rwsdk/use-synced-state/worker`).
- Scope the room's state by passing the URL's `roomId` to `useSyncedState` so that different rooms don't share data.
- Remember the worker entry must export the `SyncedStateServer` Durable Object class and register the synced state routes; the Durable Object also has to be declared in `wrangler.jsonc` (binding + `new_sqlite_classes` migration) so the SDK can wire it up.
- The form just needs a text input and a submit button — the verifier will locate them by accessible label and by the visible word "Send".
- Treat the `roomId` URL segment as an arbitrary opaque string; do not hardcode allowed room IDs.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Start command: `cd /home/user/myproject && npm run dev -- --host 0.0.0.0 --port 5173`
- Port: `5173`
- Routes:
  - `GET /chat/:roomId`: Renders a chat UI. The page must contain:
    - A text input for typing a new message (locatable via the placeholder, label, name, or aria-label `message`).
    - A clickable element whose visible text contains the word `Send` that submits the current input value.
    - A list/area showing every message previously submitted in this room, in submission order.
- Each distinct `:roomId` maintains an isolated message history. Posting in one room must not affect the messages visible on another room's page.
- After a message is submitted, its exact text appears in that room's message list on `/chat/<that roomId>` for any viewer of that page.
- After a full browser reload of `/chat/<roomId>`, every previously submitted message for that room is still visible.
- The verifier uses room IDs derived from `ZEALT_RUN_ID` (read from the environment) of the form `${ZEALT_RUN_ID}-alpha` and `${ZEALT_RUN_ID}-beta`. Your implementation must therefore accept arbitrary room ID strings via the URL parameter and not require any pre-registration.

