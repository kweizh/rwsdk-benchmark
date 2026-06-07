Using the `useSyncedState` hook allows for real-time state synchronization across multiple clients. However, missing infrastructure bindings often cause the application to crash silently.

You need to fix a broken real-time "Like" button by adding the mandatory Durable Object and SQLite configurations to a RedwoodSDK project. 

**Constraints:**
- You must export the `SyncedStateServer` class from `src/worker.tsx`.
- You must update `wrangler.jsonc` to include the required `new_sqlite_classes` migration array for the Durable Object binding.
- Do NOT modify the client component utilizing the `useSyncedState` hook.