# User Auth API with RedwoodSDK, Cloudflare D1, and Drizzle Migrations

## Background
You are building a small user registration / login API on top of RedwoodSDK (rwsdk) running on a local Cloudflare Workers runtime (Miniflare via `wrangler dev`). Persistence is handled by Cloudflare D1 (local SQLite) accessed through Drizzle ORM. The schema MUST be evolved through real Drizzle migration files generated with `drizzle-kit generate` and applied via `wrangler d1 migrations apply DB --local` — the `drizzle-kit push` shortcut is NOT allowed.

## Requirements
- Use RedwoodSDK with a Cloudflare D1 binding called `DB`.
- Define a `users` table in `src/db/schema.ts` using Drizzle's SQLite helpers and generate two migration SQL files on disk under `./drizzle/migrations/` using `drizzle-kit generate`:
  - First migration: creates the `users` table with `id`, `email`, `password_hash`, `created_at` columns.
  - Second migration: adds a nullable `display_name` column to `users`.
- Apply the migrations to the local D1 database before the dev server starts serving requests (e.g. via a pre-start script or a `predev` hook running `wrangler d1 migrations apply DB --local`).
- Expose a JSON HTTP API:
  - `POST /api/auth/register` — register a new user.
  - `POST /api/auth/login` — verify credentials.
  - `GET /api/users` — list registered users.
- Hash passwords with PBKDF2 over SHA-256 using the Web Crypto API.

## Implementation Hints
- Wire up Cloudflare D1 in `wrangler.jsonc` with `binding: "DB"`, a `database_name`, a placeholder `database_id`, and `migrations_dir: "drizzle/migrations"`.
- Configure `drizzle.config.ts` with `dialect: "sqlite"`, `schema: "./src/db/schema.ts"`, and `out: "./drizzle/migrations"` so that `drizzle-kit generate` emits files into the same directory `wrangler` consumes.
- Build the Drizzle client inside each request from `env.DB` (e.g. `drizzle(env.DB)`), since the D1 binding is per-request in Workers.
- Use RedwoodSDK's `defineApp` + `route` from `rwsdk/router` to declare the three JSON endpoints; you do not need a React document for this task.
- For password hashing use `crypto.subtle.importKey` + `crypto.subtle.deriveBits` with PBKDF2/SHA-256. Encode the stored hash so that the salt can be recovered for verification on login.
- Make sure migrations are applied automatically as part of `npm run dev` (chain a script, or call `wrangler d1 migrations apply DB --local` first) — the verifier will start the project with a single command and expect the schema to already exist.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- Migration files (paths relative to project root):
  - `drizzle/migrations/0000_init.sql` — must create a `users` table with columns `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `email` (TEXT, UNIQUE, NOT NULL), `password_hash` (TEXT, NOT NULL), and `created_at` (INTEGER, NOT NULL).
  - `drizzle/migrations/0001_add_display_name.sql` — must add a `display_name` column of type `TEXT` (nullable, default NULL) to the existing `users` table via `ALTER TABLE`.
- Password hashing: PBKDF2 with SHA-256, 100,000 iterations, a per-user random salt that is stored together with the hash so that login can re-derive and compare it. Plain-text passwords MUST NOT be stored.
- API Endpoints (all return `Content-Type: application/json`):
  - `POST /api/auth/register`
    ```json
    // Request
    {
      "email": string,
      "password": string,
      "displayName": string | null
    }
    ```
    ```json
    // Response — 201 Created
    {
      "id": number,
      "email": string,
      "displayName": string | null
    }
    ```
    - Returns 409 if `email` already exists.
    - Returns 400 if `email` or `password` is missing.
  - `POST /api/auth/login`
    ```json
    // Request
    {
      "email": string,
      "password": string
    }
    ```
    ```json
    // Response — 200 OK
    {
      "id": number,
      "email": string,
      "displayName": string | null
    }
    ```
    - Returns 401 on unknown email OR wrong password.
  - `GET /api/users`
    ```json
    // Response — 200 OK
    [
      {
        "id": number,
        "email": string,
        "displayName": string | null,
        "createdAt": number
      }
    ]
    ```
    - `createdAt` is an epoch-millisecond integer.
- Migrations must be generated with `drizzle-kit generate` and applied with `wrangler d1 migrations apply DB --local` (no `drizzle-kit push`).

