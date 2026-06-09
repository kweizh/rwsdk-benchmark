import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

// Middleware: record the request start time
function attachTiming({ ctx }: { ctx: { startedAt: number } }) {
  ctx.startedAt = Date.now();
}

// Middleware: attach tenant from X-Tenant-Id header
function attachTenant({
  request,
  ctx,
}: {
  request: Request;
  ctx: { tenant: { id: string; name: string } };
}) {
  const id = request.headers.get("X-Tenant-Id") ?? "tenant-default";
  ctx.tenant = { id, name: `Tenant ${id}` };
}

// Middleware: attach user from Authorization header
function attachUser({
  request,
  ctx,
}: {
  request: Request;
  ctx: { user: { id: string; role: "admin" | "user" } | null };
}) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const match = /^Bearer demo-(admin|user)-([A-Za-z0-9_-]+)$/.exec(
      authHeader
    );
    if (match) {
      const role = match[1] as "admin" | "user";
      const id = match[2];
      ctx.user = { id, role };
      return;
    }
  }
  ctx.user = null;
}

export default defineApp([
  setCommonHeaders(),
  attachTiming,
  attachTenant,
  attachUser,
  route("/api/context", {
    get: ({ ctx }) => {
      const elapsedMs = Date.now() - ctx.startedAt;
      return Response.json(
        { user: ctx.user, tenant: ctx.tenant, elapsedMs },
        { headers: { "Content-Type": "application/json" } }
      );
    },
  }),
  route("/api/admin", {
    get: ({ ctx }) => {
      if (ctx.user?.role === "admin") {
        return Response.json(
          { ok: true },
          { headers: { "Content-Type": "application/json" } }
        );
      }
      return Response.json(
        { error: "forbidden" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    },
  }),
  render(Document, [route("/", Home)]),
]);
