import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {
  requestId: string;
};

const requestCtxMap = new WeakMap<Request, any>();

const app = defineApp([
  setCommonHeaders(),
  ({ request, ctx, response }) => {
    ctx.requestId = crypto.randomUUID();
    response.headers.set("X-Request-Id", ctx.requestId);
    requestCtxMap.set(request, ctx);
  },
  route("/api/ping", () => {
    return Response.json(
      { pong: true },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
  render(Document, [route("/", Home)]),
]);

const originalFetch = app.fetch;
app.fetch = async (request, env, cf) => {
  const startTime = Date.now();
  let res: Response;
  try {
    res = await originalFetch(request, env, cf);
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const ctx = requestCtxMap.get(request);
    const requestId = ctx?.requestId || crypto.randomUUID();
    const userAgent = request.headers.get("user-agent") || "";
    const logObj = {
      ts: new Date().toISOString(),
      method: request.method.toUpperCase(),
      path: new URL(request.url).pathname,
      status: 500,
      durationMs,
      requestId,
      userAgent,
    };
    
    console.log("[ACCESS_LOG] " + JSON.stringify(logObj));
    throw err;
  }

  const durationMs = Date.now() - startTime;
  const ctx = requestCtxMap.get(request);
  const requestId = ctx?.requestId || res.headers.get("X-Request-Id") || crypto.randomUUID();
  const userAgent = request.headers.get("user-agent") || "";
  
  // Ensure X-Request-Id is in the response headers
  if (res.headers.get("X-Request-Id") !== requestId) {
    try {
      res.headers.set("X-Request-Id", requestId);
    } catch (e) {
      const newHeaders = new Headers(res.headers);
      newHeaders.set("X-Request-Id", requestId);
      res = new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
      });
    }
  }

  const logObj = {
    ts: new Date().toISOString(),
    method: request.method.toUpperCase(),
    path: new URL(request.url).pathname,
    status: res.status,
    durationMs,
    requestId,
    userAgent,
  };

  console.log("[ACCESS_LOG] " + JSON.stringify(logObj));

  return res;
};

export default app;
