import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const app = defineApp([
  setCommonHeaders(),
  ({ ctx, response }) => {
    ctx.requestId = crypto.randomUUID();
    response.headers.set("X-Request-Id", ctx.requestId);
  },
  route("/api/ping", () => {
    return new Response(JSON.stringify({ pong: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
  render(Document, [route("/", Home)]),
]);

export default {
  fetch: async (request: Request, env: Env, cf: ExecutionContext) => {
    const start = performance.now();
    
    // Call the original fetch
    const res = await app.fetch(request, env, cf);
    
    const durationMs = performance.now() - start;
    
    // Extract requestId from header
    const requestId = res.headers.get("X-Request-Id") || "";
    
    // Log
    const logLine = JSON.stringify({
      ts: new Date().toISOString(),
      method: request.method.toUpperCase(),
      path: new URL(request.url).pathname,
      status: res.status,
      durationMs,
      requestId,
      userAgent: request.headers.get("User-Agent") || "",
    });
    
    console.log(`__ACCESS_LOG__${logLine}`);
    
    return res;
  }
};
