import { defineApp } from "rwsdk/worker";

// ─── In-memory comment storage ──────────────────────────────────────────────
type Comment = {
  id: number;
  author: string;
  text: string;
};

const comments: Comment[] = [];
let nextId = 1;

// ─── CSRF helpers ───────────────────────────────────────────────────────────

/**
 * Generate a 32-character lowercase hex token from 16 random bytes.
 * Uses the Web Crypto API (available in workerd / Cloudflare Workers).
 */
function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison to avoid timing attacks on CSRF tokens.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parse cookies from the Cookie header into a Record<string, string>.
 */
function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// ─── CSRF guard (global middleware) ─────────────────────────────────────────

/**
 * Global middleware that rejects non-safe HTTP methods (POST, PUT, DELETE,
 * PATCH) unless the request carries a valid CSRF token.
 *
 * The token from the `csrf` cookie must match the value of the `X-CSRF-Token`
 * header or the `_csrf` form field (for form-urlencoded bodies).
 */
async function csrfGuard({ request }: { request: Request }) {
  const method = request.method.toUpperCase();
  const unsafeMethods = new Set(["POST", "PUT", "DELETE", "PATCH"]);

  // Only check unsafe methods
  if (!unsafeMethods.has(method)) {
    return; // pass through
  }

  const cookies = parseCookies(request);
  const cookieToken = cookies["csrf"];

  // Read the submitted token from header or form body
  let submittedToken: string | null = null;

  // Check X-CSRF-Token header first
  submittedToken = request.headers.get("X-CSRF-Token");

  // If not in header, check form-urlencoded body for _csrf field
  if (!submittedToken) {
    const contentType = request.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      try {
        // Clone the request so we can read the body without consuming it for the handler
        const cloned = request.clone();
        const formData = await cloned.formData();
        submittedToken = formData.get("_csrf") as string | null;
      } catch {
        // If we can't parse the body, submittedToken stays null
      }
    }
  }

  // Reject if either token is missing or they don't match
  if (!cookieToken || !submittedToken || !constantTimeEqual(cookieToken, submittedToken)) {
    return Response.json({ error: "invalid_csrf_token" }, { status: 403 });
  }

  // Pass through — token is valid
}

// ─── Route handlers ─────────────────────────────────────────────────────────

/**
 * GET /csrf — Issue a fresh CSRF token.
 * Always reachable, no CSRF check (it's a GET).
 */
async function csrfTokenHandler(): Promise<Response> {
  const token = generateCsrfToken();

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  // Set-Cookie: csrf=<token>; SameSite=Strict; Path=/
  headers.set("Set-Cookie", `csrf=${token}; SameSite=Strict; Path=/`);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers,
  });
}

/**
 * GET /api/health — Health check endpoint.
 * Always reachable, no CSRF check (it's a GET).
 */
async function healthHandler(): Promise<Response> {
  return Response.json({ status: "ok" }, { status: 200 });
}

/**
 * POST /api/comments — Protected write endpoint.
 * Requires a valid CSRF token (checked by global middleware).
 * Accepts JSON body `{"author": "...", "text": "..."}` or
 * form-urlencoded body with `author`, `text`, and `_csrf` fields.
 */
async function postCommentHandler({ request }: { request: Request }): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";

  let author: string;
  let text: string;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { author?: string; text?: string };
    author = body.author ?? "";
    text = body.text ?? "";
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    author = (formData.get("author") as string) ?? "";
    text = (formData.get("text") as string) ?? "";
  } else {
    // Try JSON anyway as fallback
    try {
      const body = (await request.json()) as { author?: string; text?: string };
      author = body.author ?? "";
      text = body.text ?? "";
    } catch {
      return Response.json({ error: "invalid_content_type" }, { status: 400 });
    }
  }

  const id = nextId++;
  const comment: Comment = { id, author, text };
  comments.push(comment);

  return Response.json(comment, { status: 201 });
}

/**
 * GET /api/comments — Public read endpoint.
 * Returns all stored comments.
 */
async function listCommentsHandler(): Promise<Response> {
  return Response.json(comments, { status: 200 });
}

// ─── Route definition helpers (avoiding rwsdk/router import) ────────────────

/**
 * Creates a route definition object compatible with defineApp.
 * Mirrors the shape produced by rwsdk's route() function.
 */
function defineRoute(path: string, handler: unknown) {
  let normalizedPath = path;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/" + normalizedPath;
  }
  if (normalizedPath !== "/*" && !normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath + "/";
  }
  return {
    path: normalizedPath,
    handler,
  };
}

// ─── App definition ─────────────────────────────────────────────────────────

export default defineApp([
  // Global CSRF middleware — runs on every request
  csrfGuard,

  // CSRF token issuance endpoint (GET — safe method, passes through csrfGuard)
  defineRoute("/csrf", csrfTokenHandler),

  // Health endpoint (GET — safe method, passes through csrfGuard)
  defineRoute("/api/health", healthHandler),

  // Comments API with method-based routing
  defineRoute("/api/comments", {
    get: listCommentsHandler,
    post: postCommentHandler,
  }),
]);
