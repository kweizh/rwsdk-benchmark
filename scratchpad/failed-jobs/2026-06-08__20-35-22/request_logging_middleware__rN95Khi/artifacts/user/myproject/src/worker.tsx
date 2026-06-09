import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const app = defineApp([
  setCommonHeaders(),
  ({ ctx, response }) => {
    const requestId = crypto.randomUUID();
    ctx.requestId = requestId;
    response.headers.set("X-Request-Id", requestId);
  },
  render(Document, [route("/", Home)]),
  route("/api/ping", () => Response.json({ pong: true })),
]);

const originalFetch = app.fetch;
app.fetch = async (request, env, cf) => {
  const startTime = Date.now();
  let response = await originalFetch(request, env, cf);
  const duration = Date.now() - startTime;

  // Ensure X-Request-Id is present on the response
  let requestId = response.headers.get("X-Request-Id");
  if (!requestId) {
    requestId = crypto.randomUUID();
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Request-Id", requestId);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  const url = new URL(request.url);
  const logEntry = {
    ts: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    status: response.status,
    durationMs: duration,
    requestId: requestId,
    userAgent: request.headers.get("User-Agent") || "",
  };

  try {
    const fs = await import("node:fs/promises");
    const logDir = "/home/user/myproject/logs";
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(`${logDir}/access.log`, JSON.stringify(logEntry) + "\n");
  } catch (e) {
    console.log(JSON.stringify(logEntry));
  }

  return response;
};

export default app;