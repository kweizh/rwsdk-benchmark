import type { RouteMiddleware } from "rwsdk/router";

// Tag used to identify structured access log lines in stdout.
// The dev.sh wrapper script strips this prefix and appends the JSON to the log file.
export const LOG_TAG = "__ACCESS_LOG__";

/**
 * First-pass middleware: assigns a UUID v4 request ID, sets X-Request-Id header,
 * and stores timing/metadata on ctx for the post-response logger to use.
 */
export const requestLogger: RouteMiddleware = ({ request, ctx, response }) => {
  // Generate UUID v4 using platform-provided crypto (available in Workers)
  const requestId = crypto.randomUUID();

  // Attach to context so downstream handlers can read ctx.requestId
  ctx.requestId = requestId;

  // Set X-Request-Id immediately so every response carries it
  response.headers.set("X-Request-Id", requestId);
};

/**
 * Emits a structured access log line to stdout.
 * Called by the fetch wrapper in worker.tsx once the final Response is known.
 */
export function emitAccessLog(
  request: Request,
  requestId: string,
  status: number,
  startMs: number,
): void {
  const url = new URL(request.url);
  const ts = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  const payload = JSON.stringify({
    ts,
    method: request.method.toUpperCase(),
    path: url.pathname,
    status,
    durationMs,
    requestId,
    userAgent: request.headers.get("User-Agent") ?? "",
  });

  // Emit a tagged line; the dev.sh wrapper tees matching lines into the log file
  console.log(`${LOG_TAG}${payload}`);
}
