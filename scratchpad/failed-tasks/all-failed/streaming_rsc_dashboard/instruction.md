# Streaming RSC Dashboard with RedwoodSDK

## Background
RedwoodSDK (rwsdk) is a server-first React framework for Cloudflare that supports React Server Components (RSC) and streaming HTML out of the box. When async server components are wrapped in `<Suspense fallback={...}>`, RedwoodSDK streams the initial HTML with the fallback markers first and then progressively flushes resolved panel HTML to the client as each async data source becomes ready. This task asks you to build a data-rich dashboard that takes advantage of that streaming behavior so that slow data sources do not block the rest of the page.

A starter RedwoodSDK project already exists at `/home/user/myproject`. Dependencies are already installed.

## Requirements
- Add a new route at `/dashboard` to the project.
- The dashboard page must contain three independent panels, each rendered by its own async React Server Component:
  - A **Revenue** panel showing the value `$12,345`.
  - A **Users** panel showing the value `1,024 active users`.
  - A **Recent Orders** panel showing the value `7 orders today`.
- Each panel must fetch its value via a `serverQuery` exported from a `"use server"` file (imported from `rwsdk/worker`).
- Each `serverQuery` must include an artificial `setTimeout`-based delay so that the panels resolve at different times. The delays must be approximately 1 second (Revenue), 2 seconds (Users), and 3 seconds (Recent Orders).
- Each panel must be wrapped in its own `<Suspense fallback={...}>` boundary on the dashboard page so that fallbacks render first and resolved content streams in progressively.
- The page HTML must stream — the initial HTTP response chunk for `/dashboard` MUST contain all three loading-state markers before any of the resolved panel content arrives.
- Each panel (both in the fallback and in the resolved state) must be rendered inside a wrapper element that carries:
  - a `data-panel` attribute identifying the panel (`revenue`, `users`, `orders`), and
  - a `data-state` attribute that is `loading` in the fallback and `ready` once the data has resolved.

## Implementation Hints
- The existing `defineApp` entry lives in `src/worker.tsx`. Use the existing `render(Document, [...])` block and add a new `route("/dashboard", DashboardPage)` entry.
- Place the `serverQuery` definitions in a `"use server"` file (for example `src/app/pages/dashboard/queries.ts`) and import `serverQuery` from `rwsdk/worker`.
- An async server component can simply `await getRevenue()` (etc.) and return JSX. Wrap each panel component in its own `<Suspense>` boundary on the dashboard page.
- Use `await new Promise((resolve) => setTimeout(resolve, ms))` inside each `serverQuery` to create the artificial delay.
- The Document component already wires up the streaming HTML response — you should not need to change it.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- Route: GET `/dashboard` returns a streamed HTML response.
- The first chunk of the streamed HTML response for `/dashboard` (received within ~500ms, well before the slowest 3s panel resolves) MUST contain a loading marker for every panel, each in the form of an element with both attributes `data-panel="<name>"` and `data-state="loading"`, where `<name>` is one of `revenue`, `users`, `orders`.
- The fully streamed response (read to completion) MUST contain, for each panel, an element with both `data-panel="<name>"` and `data-state="ready"`, where:
  - the `revenue` panel's ready element contains the text `$12,345`,
  - the `users` panel's ready element contains the text `1,024 active users`,
  - the `orders` panel's ready element contains the text `7 orders today`.
- When the page is opened in a browser, all three panels must eventually render their final text content (`$12,345`, `1,024 active users`, `7 orders today`).

