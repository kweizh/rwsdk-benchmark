# RedwoodSDK: Query Parameters & Search API

## Background
A RedwoodSDK project is pre-installed at `/home/user/myapp`. Implement an HTTP endpoint that parses URL query parameters using the standard `URL` API and returns a structured JSON response.

## Requirements
Implement `GET /search` such that it parses query parameters from the request URL.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev -- --host 0.0.0.0 --port 5173
- Port: 5173
- `GET /search` returns status 200 with `content-type: application/json`. Response body is JSON with these fields:
  - `q`: the value of the `q` query parameter, or `""` if missing.
  - `tags`: the array of all values for the repeated `tag` query parameter (in order). If absent, return `[]`.
  - `page`: the integer value of the `page` parameter, defaulting to `1` if missing or non-numeric.
  - `limit`: the integer value of the `limit` parameter, clamped to the range `[1, 100]`; default `10` if missing.
- `GET /echo` returns status 200 with `content-type: application/json`. Response body is a JSON object with **every** query parameter as a string key (single-valued; if a key appears multiple times, return the **first** value).

