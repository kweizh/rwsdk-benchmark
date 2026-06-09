import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { appContextMiddleware } from "@/app/middleware";
import { Home } from "@/app/pages/home";

export type AppContext = {
  user?: {
    id: string;
    role: "admin" | "member" | "guest";
  };
  requestId?: string;
};

export default defineApp([
  setCommonHeaders(),
  appContextMiddleware(),
  route("/me", ({ ctx }) => {
    return new Response(
      JSON.stringify({ user: ctx.user ?? null, requestId: ctx.requestId }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": ctx.requestId ?? "",
        },
      },
    );
  }),
  route("/me/role", ({ ctx }) => {
    const role = ctx.user?.role ?? "anonymous";
    return new Response(role, {
      headers: {
        "Content-Type": "text/plain",
        "X-Request-Id": ctx.requestId ?? "",
      },
    });
  }),
  render(Document, [route("/", Home)]),
]);
