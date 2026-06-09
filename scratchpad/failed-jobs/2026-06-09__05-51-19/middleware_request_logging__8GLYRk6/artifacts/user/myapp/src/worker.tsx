import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

interface LogEntry {
  method: string;
  path: string;
  userAgent: string;
}

const requestLogs: LogEntry[] = [];

export default defineApp([
  setCommonHeaders(),
  ({ request, ctx }) => {
    const url = new URL(request.url);
    const entry: LogEntry = {
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get("user-agent") ?? "",
    };
    requestLogs.push(entry);
    ctx;
  },
  route("/track/ping", () => {
    return new Response("tracked", { status: 200 });
  }),
  route("/track/pong", () => {
    return new Response("tracked", { status: 200 });
  }),
  route("/debug/last", () => {
    const last = requestLogs.length > 0 ? requestLogs[requestLogs.length - 1] : null;
    return Response.json(last ?? {}, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
  route("/debug/log", () => {
    return Response.json(
      { count: requestLogs.length, entries: requestLogs },
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }),
  render(Document, [route("/", Home)]),
]);
