# Books CRUD REST API with RedwoodSDK + Cloudflare D1 + Drizzle ORM

## Background
Build a complete REST CRUD JSON API for a `books` resource using [RedwoodSDK](https://docs.rwsdk.com/) (rwsdk). RedwoodSDK is a server-first React framework that runs as a Vite plugin on the Cloudflare Workers runtime. Persistence must be backed by a **Cloudflare D1** binding (running locally via miniflare in `wrangler dev` / the Vite Cloudflare plugin), accessed exclusively through **Drizzle ORM** (`drizzle-orm/d1`).

A RedwoodSDK starter project is already scaffolded at the project path with `node_modules` pre-installed (including `rwsdk`, `drizzle-orm`, `drizzle-kit`, `wrangler`, and the Cloudflare Vite plugin). You must wire up the D1 binding, define the Drizzle schema for `books`, generate and apply Drizzle migrations, and implement the CRUD routes inside the rwsdk `defineApp` route tree.

## Requirements
- Define a Drizzle schema for a `books` table with the columns:
  - `id` — integer primary key, autoincrement
  - `title` — text, not null
  - `author` — text, not null
  - `created_at` — text (ISO 8601 string) or integer (unix epoch ms) — must be non-null and automatically set on insert.
- Configure a Cloudflare D1 binding named `DB` in `wrangler.jsonc` with `migrations_dir` set to the Drizzle output directory.
- Generate Drizzle SQL migrations from the schema and apply them to the **local** D1 database (via `wrangler d1 migrations apply DB --local`).
- Implement the following JSON endpoints using `defineApp` / `route` from `rwsdk/worker` and `rwsdk/router`. All routes must be grouped under the `/api` prefix using the rwsdk `prefix` helper (or equivalent route grouping).
- All endpoints must read from and write to D1 through Drizzle. NEVER use in-memory state, files, or a fake DB.
- Return JSON bodies with `Content-Type: application/json`.

## Implementation Hints
- The rwsdk router is documented at https://docs.rwsdk.com/core/routing — use the object-form method handlers (`{ get, post, put, delete }`) for a single path.
- Group routes with `prefix("/api", [...])` from `rwsdk/router`.
- Drizzle + D1 integration is documented at https://docs.rwsdk.com/guides/database/drizzle — set up `src/db/schema.ts` and `src/db/db.ts` that exports a `drizzle(env.DB, { schema })` instance from `cloudflare:workers`.
- The local D1 database for the dev server is materialized under `.wrangler/state/`. Make sure your migrations are applied **before** starting the dev server, otherwise queries will fail.
- Parse JSON request bodies with the standard Web `Request#json()` API.
- Use route params (`{ params }`) for `:id` and validate that the id is a positive integer.
- The dev server is the standard rwsdk Vite dev server (`npm run dev`), which binds to port 5173 by default.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- The local D1 database must be migrated (via Drizzle migrations) before the dev server is started.
- API Endpoints (all JSON, all under the `/api` prefix):
  - **GET `/api/books`** — Returns status `200` and a JSON array of book objects, ordered by `id` ascending.

    ```json
    // Response 200
    [
      { "id": number, "title": string, "author": string, "created_at": string | number }
    ]
    ```
  - **POST `/api/books`** — Accepts a JSON body, creates a row in D1, and returns the created book with status `201`.

    ```json
    // Request body
    { "title": string, "author": string }
    ```
    ```json
    // Response 201
    { "id": number, "title": string, "author": string, "created_at": string | number }
    ```
    Missing or empty `title`/`author` must return status `400` with a JSON body of shape `{ "error": string }`.
  - **GET `/api/books/:id`** — Returns status `200` and the matching book JSON object. Returns `404` with `{ "error": string }` if no book matches the id.
  - **PUT `/api/books/:id`** — Accepts a JSON body with `title` and/or `author`, updates the row in D1, and returns status `200` with the updated book object. Returns `404` with `{ "error": string }` if no book matches the id. Returns `400` with `{ "error": string }` if the body contains neither `title` nor `author`.
  - **DELETE `/api/books/:id`** — Deletes the row and returns status `204` with an empty body. Returns `404` with `{ "error": string }` if no book matches the id.
- All endpoints must return `Content-Type: application/json` (except the 204 response, which has no body).
- All persistence must go through Drizzle ORM against the real local D1 binding. The database file must exist under `.wrangler/state/` after migrations are applied.

