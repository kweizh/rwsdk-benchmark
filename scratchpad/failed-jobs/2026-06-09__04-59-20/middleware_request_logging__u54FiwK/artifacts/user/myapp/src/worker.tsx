import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {
  lastRequest?: { method: string; path: string; userAgent: string };
};

interface LogEntry {
  method: string;
  path: string;
  userAgent: string;
}

// Module-level in-memory log — persists across requests within the same worker instance
const requestLog: LogEntry[] = [];

export default defineApp([
  setCommonHeaders(),
  ({ request, ctx }) => {
    const url = new URL(request.url);
    const entry: LogEntry = {
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get("user-agent") ?? "",
    };
    requestLog.push(entry);
    ctx.lastRequest = entry;
  },
  route("/track/ping", () => new Response("tracked", { status: 200 })),
  route("/track/pong", () => new Response("tracked", { status: 200 })),
  route("/debug/last", () => {
    const last = requestLog[requestLog.length - 1] ?? null;
    return new Response(JSON.stringify(last), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
  route("/debug/log", () => {
    const body = JSON.stringify({ count: requestLog.length, entries: requestLog });
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
  render(Document, [route("/", Home)]),
]);
