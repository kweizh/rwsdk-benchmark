### 1. Library Overview

*   **Description**: RedwoodSDK (rwsdk) is a "server-first" React framework designed specifically for the Cloudflare platform. It operates as a Vite plugin that enables React Server Components (RSC), Server Functions, and real-time state synchronization using Cloudflare Durable Objects.
*   **Ecosystem Role**: It bridges the gap between raw Cloudflare Workers and a high-level React development experience, competing with frameworks like Next.js or Remix but with a "zero-magic" philosophy that stays closer to standard Web APIs (Request/Response) and provides deep integration with Cloudflare-specific features (D1, Durable Objects, KV).
*   **Project Setup**:
    1.  Scaffold: `npx create-rwsdk@latest my-app`
    2.  Install: `npm install`
    3.  Dev Server: `npm run dev` (Powered by Vite)
    4.  Cloudflare Bindings: Configure `wrangler.jsonc` for D1, Durable Objects, etc.
    5.  Type Generation: `npx wrangler types` to sync TypeScript definitions with bindings.

### 2. Core Primitives & APIs

*   **`defineApp`**: The entry point in `src/worker.tsx`. It takes an array of middleware and route handlers.
    *   [Documentation](https://docs.rwsdk.com/core/routing)
    ```typescript
    export default defineApp([
      render(Document, [
        route("/", Home),
        route("/api/data", { get: () => new Response("OK") })
      ])
    ]);
    ```
*   **`useSyncedState`**: A hook for real-time state synchronization across clients, backed by Durable Objects.
    *   [Documentation](https://docs.rwsdk.com/experimental/realtime)
    ```typescript
    "use client";
    import { useSyncedState } from "rwsdk/use-synced-state/client";
    
    const [count, setCount] = useSyncedState(0, "global-counter", "room-id");
    ```
*   **`serverQuery` & `serverAction`**: Optimized Server Functions. `serverQuery` fetches data without re-rendering the page (data-only RSC), while `serverAction` triggers a full page re-render/rehydration.
    *   [Documentation](https://docs.rwsdk.com/core/react-server-components#serverquery-and-serveraction)
    ```typescript
    "use server";
    import { serverQuery, serverAction } from "rwsdk/worker";

    export const getItems = serverQuery(async () => db.select().from(items));
    export const addItem = serverAction(async (name: string) => db.insert(items).values({ name }));
    ```
*   **`linkFor`**: Generates a type-safe routing helper based on the app's route definitions.
    *   [Documentation](https://docs.rwsdk.com/core/routing#linkfor)
    ```typescript
    import { linkFor } from "rwsdk/router";
    import type App from "./worker";
    export const link = linkFor<App>();
    // Usage: link("/profile/:id", { id: "123" })
    ```

### 3. Real-World Use Cases & Templates

*   **Real-time Collaborative Apps**: Using `useSyncedState` for shared whiteboards, chat rooms, or live counters (e.g., the "Redwood Forest" tree-planting demo on rwsdk.com).
*   **Edge-First SaaS**: Leveraging Cloudflare D1 (SQLite) with Drizzle ORM for low-latency database access.
*   **AI-Powered Applications**: Native integration with Cloudflare AI bindings for running LLMs or generating embeddings at the edge.
*   **Example Project Structure**:
    *   `src/worker.tsx`: App definition and routing.
    *   `src/app/document.tsx`: The HTML shell (Document).
    *   `src/db/`: Drizzle schema and client setup.
    *   `src/queries.ts` / `src/actions.ts`: Server-side logic.

### 4. Developer Friction Points

*   **Durable Object Registration**: Forgetting to export the `SyncedStateServer` class from the worker entry file or missing the SQLite migration in `wrangler.jsonc` (`new_sqlite_classes`) causes real-time features to fail silently or crash.
*   **Client Hydration Missing**: Because RedwoodSDK is server-first, developers often forget to include the `<script type="module" src="/src/client.tsx"></script>` in their `Document` component, leading to "dead" client components where `useEffect` and event handlers don't run.
*   **Context Typing**: Accessing `ctx` in middleware or server functions requires manually extending `DefaultAppContext` in a global declaration file to avoid `any` types.
*   **Method Handling**: Unlike some frameworks, `HEAD` requests are not automatically handled by `GET` routes; they must be explicitly defined or they will return a 405.

### 5. Evaluation Ideas

*   **Simple**: Create a "Ping/Pong" route that returns JSX and verify it renders as HTML.
*   **Simple**: Implement a type-safe link between two pages using `linkFor`.
*   **Moderate**: Build a shared "Like" button where the count updates in real-time across all open tabs using `useSyncedState`.
*   **Moderate**: Set up a D1 database with Drizzle and create a route that fetches and displays a list of users.
*   **Moderate**: Implement an `isAuthenticated` interrupter that protects a specific route and redirects to login.
*   **Complex**: Create a multi-room chat application where room IDs are dynamically scoped via the URL and state is persisted to D1 via `registerSetStateHandler`.
*   **Complex**: Build a data-intensive dashboard using `serverQuery` for non-blocking updates and `Suspense` for loading states.
*   **Complex**: Export a `defineApp` instance to handle both HTTP requests and a Cron Trigger for background data cleanup.

### 6. Sources

1.  [RedwoodSDK Official Site](https://rwsdk.com/): Primary marketing and high-level feature overview.
2.  [RedwoodSDK Documentation](https://docs.rwsdk.com/): Detailed technical guides and API references.
3.  [RedwoodSDK LLMS.txt](https://docs.rwsdk.com/llms.txt): Structured index of all documentation pages.
4.  [Cloudflare Framework Guide: RedwoodSDK](https://developers.cloudflare.com/workers/frameworks/framework-guides/redwoodsdk/): Official Cloudflare deployment and integration guide.
5.  [RedwoodSDK GitHub](https://github.com/redwoodjs/sdk): Source code for the core framework and router.