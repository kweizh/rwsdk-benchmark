# RedwoodSDK: Nested Layouts

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Use the `layout()` helper from `rwsdk/router` to wrap a group of pages with a shared `AppLayout`, and then nest an `AdminLayout` for `/admin/*` pages.

## Requirements
- Create `src/app/layouts/AppLayout.tsx` exporting a server component `AppLayout` that wraps `children` with HTML containing a `<header>` element with the text `RedwoodSDK Demo` and a `<footer>` element with the text `© rwsdk demo`.
- Create `src/app/layouts/AdminLayout.tsx` exporting a server component `AdminLayout` that wraps `children` with HTML containing an `<aside>` element with the text `Admin Sidebar`.
- In `src/worker.tsx`, compose layouts: every page must be wrapped in `AppLayout`; pages under `/admin/*` must additionally be wrapped in `AdminLayout`.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes (must use `render(Document, layout(AppLayout, [...]))` style):
  - `GET /` → HTML contains `RedwoodSDK Demo` (from AppLayout header), `© rwsdk demo` (from AppLayout footer), and `<h1>Public Home</h1>`. HTML must NOT contain `Admin Sidebar`.
  - `GET /about` → HTML contains AppLayout markers and `<h1>About</h1>`. HTML must NOT contain `Admin Sidebar`.
  - `GET /admin/dashboard` → HTML contains AppLayout markers, the `Admin Sidebar` aside, and `<h1>Admin Dashboard</h1>`.
  - `GET /admin/users` → HTML contains all three of: AppLayout header text, `Admin Sidebar`, and `<h1>Admin Users</h1>`.

