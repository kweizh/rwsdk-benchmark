import { render, route, type RouteMiddleware } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const BEARER_REGEX = /^Bearer demo-(admin|user)-([A-Za-z0-9_-]+)$/;

const attachTiming: RouteMiddleware = ({ ctx }) => {
  ctx.startedAt = Date.now();
};

const attachTenant: RouteMiddleware = ({ request, ctx }) => {
  const tenantId = request.headers.get("X-Tenant-Id") || "tenant-default";
  ctx.tenant = { id: tenantId, name: `Tenant ${tenantId}` };
};

const attachUser: RouteMiddleware = ({ request, ctx }) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const match = authHeader.match(BEARER_REGEX);
    if (match) {
      ctx.user = { role: match[1] as "admin" | "user", id: match[2] };
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
  render(Document, [route("/", Home)]),
  route("/api/context", {
    get: ({ ctx }) => {
      return Response.json({
        user: ctx.user,
        tenant: ctx.tenant,
        elapsedMs: Date.now() - ctx.startedAt,
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
]);