import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const requestLogs: { method: string; path: string; userAgent: string }[] = [];

export default defineApp([
  setCommonHeaders(),
  ({ request }) => {
    const url = new URL(request.url);
    requestLogs.push({
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get("user-agent") || "",
    });
  },
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/track/ping", () => new Response("tracked")),
  route("/track/pong", () => new Response("tracked")),
  route("/debug/last", () => {
    const last = requestLogs[requestLogs.length - 1];
    return new Response(JSON.stringify(last), {
      headers: { "content-type": "application/json" },
    });
  }),
  route("/debug/log", () => {
    return new Response(
      JSON.stringify({
        count: requestLogs.length,
        entries: requestLogs,
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }),
  render(Document, [route("/", Home)]),
]);
