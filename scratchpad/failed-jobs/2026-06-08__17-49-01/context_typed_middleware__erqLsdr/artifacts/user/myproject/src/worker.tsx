import { render, route, RouteMiddleware } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export const attachTiming: RouteMiddleware = ({ ctx }) => {
  ctx.startedAt = Date.now();
};

export const attachTenant: RouteMiddleware = ({ request, ctx }) => {
  const tenantId = request.headers.get("X-Tenant-Id") || "tenant-default";
  ctx.tenant = {
    id: tenantId,
    name: `Tenant ${tenantId}`,
  };
};

export const attachUser: RouteMiddleware = ({ request, ctx }) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer demo-(admin|user)-([A-Za-z0-9_-]+)$/);
    if (match) {
      const role = match[1] as "admin" | "user";
      const id = match[2];
      ctx.user = { id, role };
      return;
    }
  }
  ctx.user = null;
};

export default defineApp([
  setCommonHeaders(),
  attachTiming,
  attachTenant,
  attachUser,
  render(Document, [
    route("/", Home),
  ]),
  route("/api/context", {
    get: ({ ctx }) => {
      const elapsedMs = Math.max(0, Date.now() - ctx.startedAt);
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
      } else {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },
  }),
]);
