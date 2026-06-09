import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

type LogEntry = {
  method: string;
  path: string;
  userAgent: string;
};

const requestLog: LogEntry[] = [];

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ request }) => {
    const url = new URL(request.url);
    const entry: LogEntry = {
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get("user-agent") ?? "",
    };
    requestLog.push(entry);
  },
  route("/track/ping", () => {
    return new Response("tracked", { status: 200 });
  }),
  route("/track/pong", () => {
    return new Response("tracked", { status: 200 });
  }),
  route("/debug/last", () => {
    const last = requestLog.length > 0 ? requestLog[requestLog.length - 1] : null;
    return Response.json(last ?? { method: "", path: "", userAgent: "" }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
  route("/debug/log", () => {
    return Response.json(
      { count: requestLog.length, entries: requestLog },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
  render(Document, [route("/", Home)]),
]);