/**
 * GET /csrf - Issues a fresh CSRF token.
 * Sets a cookie named "csrf" with SameSite=Strict and Path=/.
 * Returns JSON: {"token": "<32 hex chars>"}
 */
export function handleCsrfToken(): Response {
  const token = generateCsrfToken();
  const body = JSON.stringify({ token });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `csrf=${token}; SameSite=Strict; Path=/`,
    },
  });
}

/**
 * Generate a 32-character hex CSRF token from 16 random bytes.
 */
function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}