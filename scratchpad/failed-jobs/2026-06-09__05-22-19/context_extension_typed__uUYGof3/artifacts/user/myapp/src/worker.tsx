import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {
  user?: { id: string; role: "admin" | "member" | "guest" };
  requestId?: string;
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx, request, response }) => {
    const userId = request.headers.get("X-User-Id");
    if (userId) {
      const roleHeader = request.headers.get("X-User-Role");
      const role: "admin" | "member" | "guest" =
        roleHeader === "admin"
          ? "admin"
          : roleHeader === "member"
            ? "member"
            : "guest";
      ctx.user = { id: userId, role };
    }

    const requestId = crypto.randomUUID();
    ctx.requestId = requestId;
    response.headers.set("X-Request-Id", requestId);
  },
  route("/me", ({ ctx }) => {
    return Response.json({ user: ctx.user ?? null, requestId: ctx.requestId });
  }),
  route("/me/role", ({ ctx }) => {
    return new Response(ctx.user?.role ?? "anonymous", {
      headers: { "Content-Type": "text/plain" },
    });
  }),
  render(Document, [route("/", Home)]),
]);