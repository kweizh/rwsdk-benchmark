import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";

// In-memory comments storage
const comments: Array<{ id: number; author: string; text: string }> = [];
let nextId = 1;

// Constant-time comparison for CSRF tokens
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Generate a fresh 32-character hex CSRF token
function generateCSRFToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Global logger middleware
const logger = ({ request }: { request: Request }) => {
  console.log(`[DEBUG LOG] Incoming request: ${request.method} ${request.url}`);
};

// Global CSRF Middleware
const csrfGuard = async ({ request }: { request: Request }) => {
  const method = request.method;
  // Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF checks
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return;
  }

  // Parse cookies from the request
  const cookieHeader = request.headers.get("Cookie") || "";
  let csrfCookie = "";
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    if (parts.length === 2 && parts[0].trim() === "csrf") {
      csrfCookie = parts[1].trim();
    }
  });

  if (!csrfCookie) {
    return Response.json({ error: "invalid_csrf_token" }, { status: 403 });
  }

  // Retrieve the submitted token from the header or form field
  let submittedToken = request.headers.get("X-CSRF-Token");
  const contentType = request.headers.get("content-type") || "";

  if (!submittedToken && contentType.includes("application/x-www-form-urlencoded")) {
    try {
      // Clone the request so the route handler can still consume the body
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      submittedToken = formData.get("_csrf") as string | null;
    } catch (e) {
      // Ignore body parsing errors in middleware
    }
  }

  if (!submittedToken) {
    return Response.json({ error: "invalid_csrf_token" }, { status: 403 });
  }

  // Verify token matches the cookie value using constant-time comparison
  if (!constantTimeCompare(csrfCookie, submittedToken)) {
    return Response.json({ error: "invalid_csrf_token" }, { status: 403 });
  }
};

export default defineApp([
  // Global logger
  logger,

  // Global CSRF guard runs first on all requests
  csrfGuard,

  // Token issuance endpoint
  route("/csrf", () => {
    const token = generateCSRFToken();
    return Response.json(
      { token },
      {
        status: 200,
        headers: {
          "Set-Cookie": `csrf=${token}; Path=/; SameSite=Strict`,
        },
      }
    );
  }),

  // Health check endpoint
  route("/api/health", () => {
    return Response.json({ status: "ok" }, { status: 200 });
  }),

  // Public read comments endpoint
  route("/api/comments", {
    get: () => {
      return Response.json(comments, { status: 200 });
    },
    post: async ({ request }) => {
      const contentType = request.headers.get("content-type") || "";
      let author = "";
      let text = "";

      if (contentType.includes("application/json")) {
        try {
          const json = await request.clone().json() as any;
          author = json.author || "";
          text = json.text || "";
        } catch (e) {
          // Ignore json parsing error
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        try {
          const formData = await request.clone().formData();
          author = (formData.get("author") as string) || "";
          text = (formData.get("text") as string) || "";
        } catch (e) {
          // Ignore form parsing error
        }
      }

      const comment = { id: nextId++, author, text };
      comments.push(comment);

      return Response.json(comment, { status: 201 });
    },
  }),
]);
