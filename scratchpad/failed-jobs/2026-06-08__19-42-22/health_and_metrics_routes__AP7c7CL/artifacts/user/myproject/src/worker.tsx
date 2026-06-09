import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { DurableObject } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {
  KV: KVNamespace;
  DO: DurableObjectNamespace;
};

export class HealthProbeDO extends DurableObject {
  async ping() {
    return "pong";
  }
}

const moduleStartTime = Date.now();

// Metrics storage
const app_requests_total: Record<string, number> = {};
const app_request_duration_seconds: Record<string, number> = {};
const app_request_duration_count: Record<string, number> = {};
const app_request_duration_buckets: Record<string, number[]> = {};

const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function observeRequest(path: string, method: string, status: string, durationSec: number) {
  const p = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const m = method.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const s = status.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  
  const key = `path="${p}",method="${m}",status="${s}"`;
  
  app_requests_total[key] = (app_requests_total[key] || 0) + 1;
  app_request_duration_seconds[key] = (app_request_duration_seconds[key] || 0) + durationSec;
  app_request_duration_count[key] = (app_request_duration_count[key] || 0) + 1;
  
  if (!app_request_duration_buckets[key]) {
    app_request_duration_buckets[key] = new Array(BUCKETS.length + 1).fill(0);
  }
  
  let bucketIndex = BUCKETS.length;
  for (let i = 0; i < BUCKETS.length; i++) {
    if (durationSec <= BUCKETS[i]) {
      bucketIndex = i;
      break;
    }
  }
  
  for (let i = bucketIndex; i <= BUCKETS.length; i++) {
    app_request_duration_buckets[key][i]++;
  }
}

function generateMetrics() {
  let output = '';
  
  output += `# HELP app_requests_total Total number of HTTP requests\n`;
  output += `# TYPE app_requests_total counter\n`;
  for (const [key, count] of Object.entries(app_requests_total)) {
    output += `app_requests_total{${key}} ${count}\n`;
  }
  
  output += `\n# HELP app_request_duration_seconds Duration of HTTP requests\n`;
  output += `# TYPE app_request_duration_seconds histogram\n`;
  for (const [key, sum] of Object.entries(app_request_duration_seconds)) {
    const count = app_request_duration_count[key];
    const buckets = app_request_duration_buckets[key];
    
    for (let i = 0; i < BUCKETS.length; i++) {
      output += `app_request_duration_seconds_bucket{${key},le="${BUCKETS[i]}"} ${buckets[i]}\n`;
    }
    output += `app_request_duration_seconds_bucket{${key},le="+Inf"} ${buckets[BUCKETS.length]}\n`;
    output += `app_request_duration_seconds_sum{${key}} ${sum}\n`;
    output += `app_request_duration_seconds_count{${key}} ${count}\n`;
  }
  
  return output;
}

const app = defineApp<AppContext>([
  setCommonHeaders(),
  (reqInfo) => {
    const env = (reqInfo.request as any).env;
    reqInfo.ctx.KV = env?.KV;
    reqInfo.ctx.DO = env?.DO;
    
    // Set matched path header for metric extraction
    reqInfo.response.headers.set("x-matched-path", reqInfo.path);
  },
  
  route("/healthz", () => {
    return Response.json({
      status: "ok",
      uptimeSec: (Date.now() - moduleStartTime) / 1000,
      version: "1.0.0"
    });
  }),
  
  route("/readyz", async ({ ctx }) => {
    let kvOk = false;
    let doOk = false;
    
    try {
      if (ctx.KV) {
        await ctx.KV.put("health:probe", "test");
        const val = await ctx.KV.get("health:probe");
        if (val === "test") kvOk = true;
      }
    } catch (e) {
      console.error("KV check failed", e);
    }
    
    try {
      if (ctx.DO) {
        const id = ctx.DO.idFromName("probe");
        const stub = ctx.DO.get(id) as any;
        const res = await stub.ping();
        if (res === "pong") doOk = true;
      }
    } catch (e) {
      console.error("DO check failed", e);
    }
    
    if (kvOk && doOk) {
      return Response.json({
        ready: true,
        checks: {
          kv: "ok",
          durableObject: "ok"
        }
      });
    } else {
      return Response.json({
        ready: false,
        checks: {
          kv: kvOk ? "ok" : "fail",
          durableObject: doOk ? "ok" : "fail"
        }
      }, { status: 503 });
    }
  }),
  
  route("/metrics", () => {
    const metricsText = generateMetrics();
    return new Response(metricsText, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8"
      }
    });
  }),
  
  render(Document, [route("/", Home)]),
]);

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const start = Date.now();
    (request as any).env = env;
    
    const response = await app.fetch(request, env, ctx);
    const durationSec = (Date.now() - start) / 1000;
    
    let matchedPath = response.headers.get("x-matched-path") || new URL(request.url).pathname;
    
    const newResponse = new Response(response.body, response);
    newResponse.headers.delete("x-matched-path");
    
    const method = request.method;
    const status = newResponse.status.toString();
    
    observeRequest(matchedPath, method, status, durationSec);
    
    return newResponse;
  }
};
