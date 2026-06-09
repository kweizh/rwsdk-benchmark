import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx, request }) => {
    ctx.startedAt = Date.now();

    const tenantId = request.headers.get("X-Tenant-Id") || "tenant-default";
    ctx.tenant = { id: tenantId, name: `Tenant ${tenantId}` };

    const authHeader = request.headers.get("Authorization");
    ctx.user = null;
    if (authHeader) {
      const match = authHeader.match(/^Bearer demo-(admin|user)-([A-Za-z0-9_-]+)$/);
      if (match) {
        ctx.user = { role: match[1] as "admin" | "user", id: match[2] };
      }
    }
  },
  route("/api/context", {
    get: ({ ctx }) => {
      return Response.json({
        user: ctx.user,
        tenant: ctx.tenant,
        elapsedMs: Math.max(0, Date.now() - ctx.startedAt),
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
