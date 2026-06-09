import { render, route, type RouteMiddleware } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export const requestContextMiddleware = (): RouteMiddleware => {
  return ({ request, response, ctx }) => {
    // 1. Read request headers
    const userId = request.headers.get("X-User-Id");
    if (userId !== null && userId !== undefined) {
      const userRoleHeader = request.headers.get("X-User-Role");
      const role: "admin" | "member" | "guest" =
        userRoleHeader === "admin" || userRoleHeader === "member"
          ? userRoleHeader
          : "guest";
      ctx.user = {
        id: userId,
        role,
      };
    }

    // 2. Generate and store requestId
    const requestId = crypto.randomUUID();
    ctx.requestId = requestId;

    // 3. Set the response header
    response.headers.set("X-Request-Id", requestId);
  };
};

export default defineApp([
  setCommonHeaders(),
  requestContextMiddleware(),
  route("/me", ({ ctx }) => {
    return Response.json(
      { user: ctx.user ?? null, requestId: ctx.requestId },
      {
        headers: {
          "X-Request-Id": ctx.requestId!,
          "Content-Type": "application/json",
        },
      }
    );
  }),
  route("/me/role", ({ ctx }) => {
    return new Response(ctx.user?.role ?? "anonymous", {
      headers: {
        "X-Request-Id": ctx.requestId!,
        "Content-Type": "text/plain",
      },
    });
  }),
  render(Document, [route("/", Home)]),
]);
