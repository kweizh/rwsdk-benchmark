import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const BEARER_REGEX = /^Bearer demo-(admin|user)-([A-Za-z0-9_-]+)$/;

export default defineApp([
  setCommonHeaders(),

  // attachTiming: records the start time of the request
  ({ ctx }) => {
    ctx.startedAt = Date.now();
  },

  // attachTenant: reads X-Tenant-Id header, defaults to "tenant-default"
  ({ request, ctx }) => {
    const id = request.headers.get("X-Tenant-Id") ?? "tenant-default";
    ctx.tenant = { id, name: `Tenant ${id}` };
  },

  // attachUser: parses Authorization header for Bearer demo-<role>-<id>
  ({ request, ctx }) => {
    const auth = request.headers.get("Authorization");
    const match = auth ? BEARER_REGEX.exec(auth) : null;
    if (match) {
      ctx.user = { role: match[1] as "admin" | "user", id: match[2] };
    } else {
      ctx.user = null;
    }
  },

  // API routes
  route("/api/context", {
    get: ({ ctx }) => {
      const elapsedMs = Date.now() - ctx.startedAt;
      return Response.json({
        user: ctx.user,
        tenant: ctx.tenant,
        elapsedMs,
      });
    },
  }),

  route("/api/admin", {
    get: ({ ctx }) => {
      if (ctx.user?.role === "admin") {
        return Response.json({ ok: true });
      }
      return Response.json({ error: "forbidden" }, { status: 403 });
    },
  }),

  render(Document, [route("/", Home)]),
]);
