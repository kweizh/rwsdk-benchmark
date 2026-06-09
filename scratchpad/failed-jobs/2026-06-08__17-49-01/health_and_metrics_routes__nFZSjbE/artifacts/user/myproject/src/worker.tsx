import { render, route, matchPath } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { DurableObject, env as cfEnv } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// 1. Declare Env interface and global variables
interface Env {
  ASSETS: Fetcher;
  MY_KV?: KVNamespace;
  MY_DURABLE_OBJECT?: DurableObjectNamespace<MyDurableObject>;
}

let globalEnv: Env;

const getEnv = (): Env => {
  return globalEnv || (cfEnv as any);
};

const startTime = Date.now();

// 2. Durable Object Class
export class MyDurableObject extends DurableObject {
  constructor(state: any, env: any) {
    super(state, env);
  }

  async ping() {
    return "pong";
  }
}

// 3. Metrics Manager & Prometheus exposition helpers
const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

interface MetricLabels {
  path: string;
  method: string;
  status: string;
}

function escapeLabelValue(val: string): string {
  return val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function getLabelKey(labels: MetricLabels): string {
  return `${labels.path}||${labels.method}||${labels.status}`;
}

class MetricsManager {
  private store = new Map<string, {
    labels: MetricLabels;
    count: number;
    sum: number;
    bucketCounts: number[];
    totalCount: number;
  }>();

  recordRequest(labels: MetricLabels, durationSeconds: number) {
    const key = getLabelKey(labels);
    let entry = this.store.get(key);
    if (!entry) {
      entry = {
        labels,
        count: 0,
        sum: 0,
        bucketCounts: new Array(BUCKETS.length + 1).fill(0),
        totalCount: 0,
      };
      this.store.set(key, entry);
    }

    entry.count++;
    entry.totalCount++;
    entry.sum += durationSeconds;

    for (let i = 0; i < BUCKETS.length; i++) {
      if (durationSeconds <= BUCKETS[i]) {
        entry.bucketCounts[i]++;
      }
    }
    entry.bucketCounts[BUCKETS.length]++;
  }

  getExposition(): string {
    let lines: string[] = [];

    // app_requests_total
    lines.push("# HELP app_requests_total Total number of application requests handled.");
    lines.push("# TYPE app_requests_total counter");
    for (const entry of this.store.values()) {
      const { path, method, status } = entry.labels;
      const labelStr = `path="${escapeLabelValue(path)}",method="${escapeLabelValue(method)}",status="${escapeLabelValue(status)}"`;
      lines.push(`app_requests_total{${labelStr}} ${entry.count}`);
    }

    // app_request_duration_seconds
    lines.push("# HELP app_request_duration_seconds Request duration in seconds histogram.");
    lines.push("# TYPE app_request_duration_seconds histogram");
    for (const entry of this.store.values()) {
      const { path, method, status } = entry.labels;
      const labelPrefix = `path="${escapeLabelValue(path)}",method="${escapeLabelValue(method)}",status="${escapeLabelValue(status)}"`;
      
      for (let i = 0; i < BUCKETS.length; i++) {
        lines.push(`app_request_duration_seconds_bucket{${labelPrefix},le="${BUCKETS[i]}"} ${entry.bucketCounts[i]}`);
      }
      lines.push(`app_request_duration_seconds_bucket{${labelPrefix},le="+Inf"} ${entry.bucketCounts[BUCKETS.length]}`);
      
      lines.push(`app_request_duration_seconds_sum{${labelPrefix}} ${entry.sum}`);
      lines.push(`app_request_duration_seconds_count{${labelPrefix}} ${entry.totalCount}`);
    }

    return lines.join("\n") + "\n";
  }
}

const metricsManager = new MetricsManager();

// 4. Route Handlers
const healthzHandler = () => {
  const uptimeSec = (Date.now() - startTime) / 1000;
  return Response.json({
    status: "ok",
    uptimeSec,
    version: "1.0.0"
  }, {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

const readyzHandler = async () => {
  const env = getEnv();
  try {
    if (!env.MY_KV) {
      throw new Error("KV binding MY_KV is missing");
    }
    await env.MY_KV.put("health:probe", "ok");
    const kvValue = await env.MY_KV.get("health:probe");
    if (kvValue !== "ok") {
      throw new Error("KV verification failed");
    }

    if (!env.MY_DURABLE_OBJECT) {
      throw new Error("Durable Object binding MY_DURABLE_OBJECT is missing");
    }
    const id = env.MY_DURABLE_OBJECT.idFromName("health-check");
    const stub = env.MY_DURABLE_OBJECT.get(id);
    const doValue = await stub.ping();
    if (doValue !== "pong") {
      throw new Error(`Durable Object returned unexpected value: ${doValue}`);
    }

    return Response.json({
      ready: true,
      checks: {
        kv: "ok",
        durableObject: "ok"
      }
    }, { status: 200 });

  } catch (err) {
    console.error("Readiness check failed:", err);
    let kvStatus = "ok";
    let doStatus = "ok";

    try {
      if (!env.MY_KV) throw new Error();
      await env.MY_KV.put("health:probe", "ok");
      const val = await env.MY_KV.get("health:probe");
      if (val !== "ok") throw new Error();
    } catch {
      kvStatus = "fail";
    }

    try {
      if (!env.MY_DURABLE_OBJECT) throw new Error();
      const id = env.MY_DURABLE_OBJECT.idFromName("health-check");
      const stub = env.MY_DURABLE_OBJECT.get(id);
      const val = await stub.ping();
      if (val !== "pong") throw new Error();
    } catch {
      doStatus = "fail";
    }

    return Response.json({
      ready: false,
      checks: {
        kv: kvStatus,
        durableObject: doStatus
      }
    }, { status: 503 });
  }
};

const metricsHandler = () => {
  const body = metricsManager.getExposition();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8"
    }
  });
};

// 5. Route helper functions for metrics tracking
function flattenRoutes(routes: any[]): any[] {
  return routes.reduce((acc, route) => {
    if (Array.isArray(route)) {
      return [...acc, ...flattenRoutes(route)];
    }
    return [...acc, route];
  }, []);
}

function getMatchedPathPattern(routes: any[], pathname: string): string | null {
  let normalizedPath = pathname;
  if (normalizedPath !== "/" && !normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath + "/";
  }

  const flattened = flattenRoutes(routes);
  for (const r of flattened) {
    if (r && typeof r === "object" && "path" in r) {
      if (matchPath(r.path, normalizedPath) !== null) {
        let pattern = r.path;
        if (!pathname.endsWith("/") && pattern.endsWith("/") && pattern !== "/") {
          pattern = pattern.slice(0, -1);
        }
        return pattern;
      }
    }
  }
  return null;
}

// 6. Define the App
const app = defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },
  route("/healthz", { get: healthzHandler }),
  route("/readyz", { get: readyzHandler }),
  route("/metrics", { get: metricsHandler }),
  render(Document, [route("/", Home)]),
]);

// 7. Export wrapped app to observe requests and track metrics
export default {
  ...app,
  fetch: async (request: Request, env: Env, cf: ExecutionContext) => {
    globalEnv = env;
    const startTime = performance.now();
    let status = 500;
    try {
      const response = await app.fetch(request, env, cf);
      status = response.status;
      return response;
    } catch (err) {
      status = 500;
      throw err;
    } finally {
      const duration = (performance.now() - startTime) / 1000;
      const url = new URL(request.url);
      const pathname = url.pathname;
      if (!pathname.startsWith("/__") && !pathname.includes("/assets/")) {
        const matchedPattern = getMatchedPathPattern(app.__rwRoutes, pathname) || pathname;
        metricsManager.recordRequest({
          path: matchedPattern,
          method: request.method,
          status: String(status)
        }, duration);
      }
    }
  }
};
