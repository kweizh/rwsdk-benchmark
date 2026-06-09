import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// Request logging middleware – runs on every request before route matching.
// Sets ctx.requestId and X-Request-Id header, then schedules a deferred log
// write that captures the final response status after all handlers complete.
const requestLogger = async ({
  request,
  response,
  ctx,
}: {
  request: Request;
  response: ResponseInit & { headers: Headers };
  ctx: AppContext & { requestId?: string; _startTime?: number };
}) => {
  const requestId = crypto.randomUUID();
  ctx.requestId = requestId;
  response.headers.set("X-Request-Id", requestId);

  const startTime = performance.now();
  ctx._startTime = startTime;

  // Defer the log write until after route handlers have set the final status.
  // setTimeout(0) creates a macrotask that runs after all microtasks (including
  // async route handler resolutions) complete.
  setTimeout(() => {
    const durationMs =
      Math.round((performance.now() - startTime) * 100) / 100;
    const url = new URL(request.url);
    const logEntry = {
      ts: new Date().toISOString(),
      method: request.method.toUpperCase(),
      path: url.pathname,
      status: response.status ?? 200,
      durationMs,
      requestId,
      userAgent: request.headers.get("User-Agent") ?? "",
    };

    // Write to access log via node:fs in dev (nodejs_compat), fall back to
    // console.log for environments where node:fs is unavailable.
    const logLine = JSON.stringify(logEntry) + "\n";
    const writeLog = async () => {
      try {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const logDir = "/home/user/myproject/logs";
        await fs.mkdir(logDir, { recursive: true });
        await fs.appendFile(path.join(logDir, "access.log"), logLine);
      } catch {
        // Fallback: emit structured log line for wrapper script to capture
        console.log(logLine.trimEnd());
      }
    };
    writeLog();
  }, 0);
};

export default defineApp([
  setCommonHeaders(),
  requestLogger,
  // GET /api/ping – returns {"pong":true} as JSON
  route("/api/ping", {
    get: () => {
      return Response.json({ pong: true }, { status: 200 });
    },
  }),
  render(Document, [route("/", Home)]),
]);
