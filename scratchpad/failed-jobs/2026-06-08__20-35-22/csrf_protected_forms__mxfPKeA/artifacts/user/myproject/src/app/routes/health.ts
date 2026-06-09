/**
 * GET /api/health - Health check endpoint.
 * Always reachable, no CSRF protection needed (safe method).
 */
export function handleHealth(): Response {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}