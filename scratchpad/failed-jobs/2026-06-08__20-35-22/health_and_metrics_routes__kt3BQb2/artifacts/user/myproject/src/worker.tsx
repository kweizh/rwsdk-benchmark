import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { HealthDurableObject } from "@/app/health/durableObject";
import {
  incrementCounter,
  observeDuration,
  getUptimeSeconds,
  formatMetrics,
} from "@/app/health/metrics";

export type AppContext = {};

/** Health check: basic liveness */
function healthzHandler() {
  return Response.json({
    status: "ok",
    uptimeSec: getUptimeSeconds(),
    version: "1.0.0",
  });
}

/** Readiness check: KV write/read + Durable Object ping */
async function readyzHandler() {
  const checks: { kv: string; durableObject: string } = {
    kv: "ok",
    durableObject: "ok",
  };
  let ready = true;

  // KV check: write a value and read it back
  try {
    await env.HEALTH_KV.put("health:probe", "ok");
    const value = await env.HEALTH_KV.get("health:probe");
    if (value !== "ok") {
      checks.kv = "fail";
      ready = false;
    }
  } catch {
    checks.kv = "fail";
    ready = false;
  }

  // Durable Object check: ping should return "pong"
  try {
    const id = env.HEALTH_DO.idFromName("health-probe");
    const stub = env.HEALTH_DO.get(id);
    const result = await stub.ping();
    if (result !== "pong") {
      checks.durableObject = "fail";
      ready = false;
    }
  } catch {
    checks.durableObject = "fail";
    ready = false;
  }

  return Response.json(
    { ready, checks },
    { status: ready ? 200 : 503 }
  );
}

/** Prometheus metrics exposition */
function metricsHandler() {
  const body = formatMetrics();
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}

// Build the app with all routes
const app = defineApp([
  setCommonHeaders(),
  route("/healthz", healthzHandler),
  route("/readyz", readyzHandler),
  route("/metrics", metricsHandler),
  render(Document, [route("/", Home)]),
]);

// Wrap the fetch handler with metrics middleware that runs for every request
const originalFetch = app.fetch.bind(app);
app.fetch = async (
  request: Request,
  envParam: Env,
  cf: ExecutionContext
) => {
  const start = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const response = await originalFetch(request, envParam, cf);

  const duration = (Date.now() - start) / 1000;
  const status = String(response.status);

  incrementCounter(path, method, status);
  observeDuration(path, method, status, duration);

  return response;
};

export default app;
export { HealthDurableObject };