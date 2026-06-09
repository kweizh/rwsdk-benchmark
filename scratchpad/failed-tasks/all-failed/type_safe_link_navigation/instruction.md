# Type-Safe Link Navigation with RedwoodSDK

## Background
Build a small multi-page RedwoodSDK app that demonstrates type-safe routing using the `linkFor` helper from `rwsdk/router`. The app must never hardcode URL strings in JSX; every internal link must be produced by the typed `link` helper derived from `defineApp`'s route table.

## Requirements
- Use the RedwoodSDK scaffold (Vite plugin + `defineApp` + `rwsdk/router`) at the project path below.
- Define four routes inside `defineApp`:
  - `/` — home page that lists three seed users.
  - `/users` — a flat list of the same three seed users.
  - `/users/:id` — a user detail page that lists that user's seed posts.
  - `/users/:id/posts/:postId` — a post detail page that renders both route params and a back link to the user.
- Generate **all** internal `href` values via the `linkFor<App>()` helper. Importing `link` from a shared module and using `link("/users/:id", { id })` (etc.) is required; literal route strings inside `<a href=...>` are forbidden.
- The seed data is fixed and rendered server-side (no DB required):
  - Users: id `1` ("Ada"), `2` ("Bao"), `3` ("Cyrus").
  - Each user has exactly two posts with ids `p1` and `p2` and titles of the form `"<UserName> Post 1"` and `"<UserName> Post 2"`.
- The home page (`/`) must list each user as a link to `/users/:id` (built with `linkFor`).
- The `/users/:id` page must render the user's name and list their two posts as links to `/users/:id/posts/:postId` (built with `linkFor`).
- The `/users/:id/posts/:postId` page must render the post title, both ids (so the verifier can read them), and a back link to `/users/:id` (built with `linkFor`).
- The app must be runnable with `npm run dev` and respond to plain HTTP requests on the dev server port with fully streamed HTML containing the expected `<a href="...">` values.

## Implementation Hints
- Scaffold with `npx create-rwsdk@latest` (or set up an equivalent Vite + rwsdk worker manually) and define routes in `src/worker.tsx` using `defineApp`, `render`, and `route` from `rwsdk/router`.
- Create a shared links module (e.g. `src/app/shared/links.ts`) that does `import type * as Worker from "../../worker"; type App = typeof Worker.default; export const link = linkFor<App>();`.
- Render route params via the `params` argument that `rwsdk` passes to each route handler.
- Do not rely on a database; inline the seed data in a module and import it from each page.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- The dev server must serve all four routes with HTTP 200 and HTML responses.
- Seed data (fixed, required so the verifier can navigate deterministically):
  - Users with ids `1`, `2`, `3` and names `Ada`, `Bao`, `Cyrus` respectively.
  - Every user has exactly two posts with ids `p1` and `p2`.
- Link shapes (all generated via `linkFor`, no hardcoded route strings):
  - Home page (`/`) HTML must contain `<a href="/users/1">`, `<a href="/users/2">`, `<a href="/users/3">`.
  - User page (`/users/1`) HTML must contain `<a href="/users/1/posts/p1">` and `<a href="/users/1/posts/p2">`.
  - Post page (`/users/1/posts/p1`) HTML must contain a back link `<a href="/users/1">` and must render both the user id `1` and the post id `p1` somewhere in the body.
- A shared `link` helper derived from `linkFor<App>()` must exist (e.g. `src/app/shared/links.ts`); page components must import this helper rather than hardcoding URL paths.
- The app must not crash on direct navigation to any of `/`, `/users`, `/users/2`, or `/users/3/posts/p2`.

