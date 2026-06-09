import type { RequestInfo } from "rwsdk/worker";
import { parse } from "cookie";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if the strings are equal, false otherwise.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract the csrf cookie value from a Request's Cookie header.
 */
function getCsrfCookieValue(request: Request): string | undefined {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return undefined;
  const cookies = parse(cookieHeader);
  return cookies["csrf"];
}

/**
 * Parse a URL-encoded form body and extract the _csrf field.
 */
async function getCsrfFromFormBody(request: Request): Promise<string | undefined> {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return undefined;
  }
  // Clone the request so we don't consume the original body
  const cloned = request.clone();
  const text = await cloned.text();
  const params = new URLSearchParams(text);
  return params.get("_csrf") ?? undefined;
}

/**
 * Global middleware that enforces CSRF protection for unsafe HTTP methods.
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 * For unsafe methods (POST, PUT, DELETE, PATCH), the request must include
 * a csrf cookie and either an X-CSRF-Token header or a _csrf form field
 * that matches the cookie value.
 */
export async function csrfGuard({ request }: RequestInfo): Promise<Response | void> {
  const method = request.method.toUpperCase();

  // Safe methods are always allowed
  if (SAFE_METHODS.has(method)) {
    return;
  }

  const cookieValue = getCsrfCookieValue(request);

  // Check X-CSRF-Token header first
  const headerValue = request.headers.get("X-CSRF-Token");

  if (headerValue !== null && cookieValue !== undefined) {
    if (timingSafeEqual(headerValue, cookieValue)) {
      return; // CSRF token matches, allow through
    }
  }

  // If header is not present or doesn't match, try form body _csrf field
  if (!headerValue) {
    const formValue = await getCsrfFromFormBody(request);
    if (formValue !== undefined && cookieValue !== undefined) {
      if (timingSafeEqual(formValue, cookieValue)) {
        return; // CSRF token matches, allow through
      }
    }
  }

  // CSRF validation failed
  return new Response(JSON.stringify({ error: "invalid_csrf_token" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}