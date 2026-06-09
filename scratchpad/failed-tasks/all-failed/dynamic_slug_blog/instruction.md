# Dynamic Slug Blog with RedwoodSDK

## Background
Build a small server-rendered Markdown blog using RedwoodSDK (rwsdk). The blog reads its posts from a JSON file, renders Markdown to HTML on the server, exposes a raw markdown endpoint, and returns a 404 for unknown slugs.

## Requirements
- An index page at `/` that lists all posts as cards. Each card must show the post title, author, published date, and a link to the post detail page.
- A detail page at `/posts/:slug` that renders the post's Markdown body to HTML. The HTML document for the detail page must:
  - Set the document `<title>` to the post title.
  - Include an `<h1>` whose text matches the post title.
  - Include a `<meta name="description">` tag whose `content` is the first 100 characters of the post's raw markdown body, HTML-escaped.
- A raw endpoint at `/posts/:slug/raw` that returns the raw markdown body as `text/plain`.
- Requests to unknown slugs (`/posts/:slug` or `/posts/:slug/raw`) must return HTTP status `404`.
- Posts must be loaded from `src/data/posts.json` and seeded with exactly the three posts described below.

## Implementation Hints
- The project has been scaffolded with `npx create-rwsdk@latest` already; you only need to add routes, the `posts.json` file, and the Markdown rendering logic.
- Use rwsdk's dynamic path parameters (e.g. `route("/posts/:slug", ...)`) — `params.slug` is exposed on the request handler.
- Use a Markdown library such as `marked` or `markdown-it` (already installed) to convert Markdown to HTML on the server.
- HTML-escape the meta-description content so quotes and angle brackets do not break the markup.
- For unknown slugs, return a `new Response(..., { status: 404 })`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- Posts data file: `src/data/posts.json` must exist and contain the three seeded posts (slugs: `hello-rwsdk`, `cf-edge-tips`, `react-rsc-101`).
- Routes:
  - `GET /`: Returns status `200`, `Content-Type: text/html`, and lists each post with its title, author, and published date. Each card must contain an anchor `<a href="/posts/<slug>">` linking to the corresponding detail page.
  - `GET /posts/:slug` (known slug): Returns status `200`, `Content-Type: text/html`. The HTML must contain:
    - A `<title>` element whose text equals the post title.
    - An `<h1>` whose text equals the post title.
    - A `<meta name="description" content="...">` whose content is the first 100 characters of the post's raw markdown body, HTML-escaped.
    - The Markdown body rendered as HTML.
  - `GET /posts/:slug/raw` (known slug): Returns status `200`, `Content-Type` starting with `text/plain`, and a body that exactly matches the raw markdown stored in `posts.json`.
  - `GET /posts/unknown-slug` and `GET /posts/unknown-slug/raw`: Return status `404`.

