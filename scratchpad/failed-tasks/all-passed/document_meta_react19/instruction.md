# RedwoodSDK: React 19 Metadata Tags

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. React 19 hoists `<title>` and `<meta>` components into the document head automatically. Use that mechanism so each page renders its own page-specific metadata, while the `Document` shell stays generic.

## Requirements
Implement page server components that render `<title>` and `<meta>` tags inline. Do **not** hard-code page-specific titles in the `Document` component.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- Routes (all under the existing `render(Document, ...)` block):
  - `GET /` → final HTML `<head>` must contain `<title>Home — rwsdk</title>` and `<meta name="description" content="Welcome to the rwsdk demo home page."`. Body must contain `<h1>Home</h1>`.
  - `GET /about` → `<head>` must contain `<title>About — rwsdk</title>` and `<meta name="description" content="Learn more about the rwsdk demo."`. Body contains `<h1>About</h1>`.
  - `GET /docs` → `<head>` contains `<title>Docs — rwsdk</title>`, `<meta name="description" content="Docs for the rwsdk demo."`, and an Open Graph image meta `<meta property="og:image" content="/og/docs.png"`. Body contains `<h1>Docs</h1>`.

