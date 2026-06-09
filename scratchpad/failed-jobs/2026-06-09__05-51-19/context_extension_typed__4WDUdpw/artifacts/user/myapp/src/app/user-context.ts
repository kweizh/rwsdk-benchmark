import { RouteMiddleware } from "rwsdk/router";

export const userContextMiddleware =
  (): RouteMiddleware =>
  ({ request, ctx, response }) => {
    // Generate a requestId
    ctx.requestId = crypto.randomUUID();

    // Set the X-Request-Id response header
    response.headers.set("X-Request-Id", ctx.requestId);

    // Read X-User-Id header and populate ctx.user
    const userId = request.headers.get("X-User-Id");
    if (userId) {
      const roleHeader = request.headers.get("X-User-Role");
      const role: "admin" | "member" | "guest" =
        roleHeader === "admin" || roleHeader === "member" ? roleHeader : "guest";
      ctx.user = { id: userId, role };
    }
  };
