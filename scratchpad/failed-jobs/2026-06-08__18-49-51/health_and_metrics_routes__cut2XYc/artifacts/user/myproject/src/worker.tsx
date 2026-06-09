import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { incRequestCounter, observeDuration, renderMetrics } from "@/observability/metrics";

// Re-export the Durable Object class so wrangler can find it.
export { HealthProbe } from "@/durableObjects/HealthProbe";

// ── Module-level uptime tracking ─────────────────────────────────────────────
const workerStartTime = Date.now();

// ── Module-level env reference ────────────────────────────────────────────────
// Set at the top of every fetch() invocation so route handlers can read it.
let _env: Env | null = null;

export function getEnv(): Env | null {
  return _env;
}

// ── App context ───────────────────────────────────────────────────────────────
export type AppContext = Record<string, unknown>;

// ── /healthz ──────────────────────────────────────────────────────────────────
function handleHealthz(): Response {
  const uptimeSec = (Date.now() - workerStartTime) / 1000;
  return Response.json(
    { status: "ok", uptimeSec, version: "1.0.0" },
    { status: 200 },
  );
}

// ── /readyz ───────────────────────────────────────────────────────────────────
async function handleReadyz(): Promise<Response> {
  const env = _env;
  const checks: { kv: string; durableObject: string } = {
    kv: "fail",
    durableObject: "fail",
  };

  // KV check: write then read back
  if (env?.HEALTH_KV) {
    try {
      await env.HEALTH_KV.put("health:probe", "1");
      const val = await env.HEALTH_KV.get("health:probe");
      if (val === "1") {
        checks.kv = "ok";
      }
    } catch {
      checks.kv = "fail";
    }
  }

  // Durable Object check: call ping via fetch
  if (env?.HEALTH_DO) {
    try {
      const id = env.HEALTH_DO.idFromName("health-singleton");
      const stub = env.HEALTH_DO.get(id);
      const pingRes = await stub.fetch(new Request("http://do-internal/ping"));
      const body = await pingRes.text();
      if (body === "pong") {
        checks.durableObject = "ok";
      }
    } catch {
      checks.durableObject = "fail";
    }
  }

  const ready = checks.kv === "ok" && checks.durableObject === "ok";
  return Response.json({ ready, checks }, { status: ready ? 200 : 503 });
}

// ── /metrics ──────────────────────────────────────────────────────────────────
function handleMetrics(): Response {
  return new Response(renderMetrics(), {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}

// ── rwsdk app ─────────────────────────────────────────────────────────────────
const app = defineApp([
  // Global middleware: record metrics for every request
  ({ request }: { request: Request; [k: string]: unknown }) => {
    (request as any).__metricsStart = Date.now();
    (request as any).__metricsMethod = request.method.toUpperCase();
    (request as any).__metricsPath = new URL(request.url).pathname;
  },

  // Observability routes
  route("/healthz", { get: handleHealthz }),
  route("/readyz", { get: handleReadyz }),
  route("/metrics", { get: handleMetrics }),

  setCommonHeaders(),
  render(Document, [route("/", Home)]),
]);

// ── Wrapping fetch to capture env and record metrics ──────────────────────────
// Cloudflare calls: `export default { fetch(request, env, executionCtx) }`
// rwsdk's AppDefinition exposes `.fetch(request, env, cf)` — we wrap it to
// (1) stash env in the module-level `_env` variable,
// (2) record Prometheus metrics around each response.
const wrappedFetch = async (
  request: Request,
  env: Env,
  cf: ExecutionContext,
): Promise<Response> => {
  // Capture env for route handlers
  _env = env;

  const start = Date.now();
  const method = request.method.toUpperCase();
  const pathname = new URL(request.url).pathname;

  let response: Response;
  try {
    response = await app.fetch(request, env, cf);
  } catch (err) {
    // Record failed requests
    const elapsed = (Date.now() - start) / 1000;
    incRequestCounter(pathname, method, "500");
    observeDuration(pathname, method, elapsed);
    throw err;
  }

  const elapsed = (Date.now() - start) / 1000;
  const status = String(response.status);
  incRequestCounter(pathname, method, status);
  observeDuration(pathname, method, elapsed);

  return response;
};

export default {
  fetch: wrappedFetch,
  // Expose __rwRoutes so rwsdk tooling can introspect routes if needed
  __rwRoutes: app.__rwRoutes,
};
