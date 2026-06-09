import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {
  method?: string;
  path?: string;
  userAgent?: string;
};

const requestLog: Array<{ method: string; path: string; userAgent: string }> = [];

export default defineApp([
  setCommonHeaders(),
  ({ ctx, request }) => {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const userAgent = request.headers.get("user-agent") || "";

    // Mutate the shared ctx
    ctx.method = method;
    ctx.path = path;
    ctx.userAgent = userAgent;

    // Record the request in our in-memory array
    requestLog.push({ method, path, userAgent });
  },
  render(Document, [
    route("/", Home),
    route("/track/ping", () => {
      return new Response("tracked", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }),
    route("/track/pong", () => {
      return new Response("tracked", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }),
    route("/debug/last", () => {
      const last = requestLog[requestLog.length - 1];
      return Response.json(last || null, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
    route("/debug/log", () => {
      return Response.json({
        count: requestLog.length,
        entries: requestLog,
      }, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  ]),
]);
