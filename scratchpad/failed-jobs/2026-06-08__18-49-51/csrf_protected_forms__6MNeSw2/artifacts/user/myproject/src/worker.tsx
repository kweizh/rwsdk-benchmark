import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";

// ---------------------------------------------------------------------------
// In-memory comment storage (per-process)
// ---------------------------------------------------------------------------

interface Comment {
  id: number;
  author: string;
  text: string;
}

const comments: Comment[] = [];
let nextId = 1;

// ---------------------------------------------------------------------------
// CSRF helpers
// ---------------------------------------------------------------------------

function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getCsrfCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name.trim() === "csrf") {
      return rest.join("=").trim();
    }
  }
  return null;
}

/** Constant-time string comparison to avoid timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function csrfForbidden(): Response {
  return new Response(JSON.stringify({ error: "invalid_csrf_token" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * CSRF interrupter – rejects non-safe methods that lack a valid token.
 * Safe methods (GET, HEAD) pass through unconditionally.
 */
async function csrfGuard({
  request,
}: {
  request: Request;
  ctx: Record<string, any>;
  args: any[];
}): Promise<Response | void> {
  const method = request.method.toUpperCase();
  const safeMethods = new Set(["GET", "HEAD"]);

  if (safeMethods.has(method)) {
    return; // allow
  }

  const cookieToken = getCsrfCookie(request);

  // Try X-CSRF-Token header first
  const headerToken = request.headers.get("X-CSRF-Token");
  if (headerToken !== null) {
    if (!cookieToken || !safeEqual(headerToken, cookieToken)) {
      return csrfForbidden();
    }
    return; // valid header token
  }

  // Try _csrf form field (application/x-www-form-urlencoded)
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    // We must clone the request to read the body (the handler needs the
    // original body too, but since the interrupter only returns void on
    // success the framework will call the handler with the original request).
    const cloned = request.clone();
    const text = await cloned.text();
    const params = new URLSearchParams(text);
    const formToken = params.get("_csrf");
    if (formToken !== null) {
      if (!cookieToken || !safeEqual(formToken, cookieToken)) {
        return csrfForbidden();
      }
      return; // valid form token
    }
  }

  // No token provided at all
  return csrfForbidden();
}

// ---------------------------------------------------------------------------
// App definition
// ---------------------------------------------------------------------------

export default defineApp([
  // ── Token issuance endpoint ──────────────────────────────────────────────
  route("/csrf", {
    get: () => {
      const token = generateCsrfToken();
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `csrf=${token}; Path=/; SameSite=Strict`,
        },
      });
    },
  }),

  // ── Health endpoint ──────────────────────────────────────────────────────
  route("/api/health", {
    get: () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  }),

  // ── Comments endpoints ───────────────────────────────────────────────────
  route("/api/comments", {
    get: () =>
      new Response(JSON.stringify(comments), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),

    post: [
      csrfGuard,
      async ({ request }: { request: Request }) => {
        const contentType = request.headers.get("Content-Type") ?? "";
        let author: string | null = null;
        let text: string | null = null;

        if (contentType.includes("application/x-www-form-urlencoded")) {
          const body = await request.text();
          const params = new URLSearchParams(body);
          author = params.get("author");
          text = params.get("text");
        } else {
          // Assume JSON
          const body = (await request.json()) as Record<string, unknown>;
          author = typeof body.author === "string" ? body.author : null;
          text = typeof body.text === "string" ? body.text : null;
        }

        if (author === null || text === null) {
          return new Response(
            JSON.stringify({ error: "author and text are required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const comment: Comment = { id: nextId++, author, text };
        comments.push(comment);

        return new Response(JSON.stringify(comment), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    ],
  }),
]);
