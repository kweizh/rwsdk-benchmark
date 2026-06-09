import { RouteMiddleware } from "rwsdk/router";

export const appContextMiddleware = (): RouteMiddleware => ({ ctx, request, response }) => {
  // Generate a unique request ID
  const requestId = crypto.randomUUID();
  ctx.requestId = requestId;

  // Set X-Request-Id response header
  response.headers.set("X-Request-Id", requestId);

  // Populate ctx.user from request headers if X-User-Id is present
  const userId = request.headers.get("X-User-Id");
  if (userId) {
    const rawRole = request.headers.get("X-User-Role");
    const role =
      rawRole === "admin" || rawRole === "member" ? rawRole : "guest";
    ctx.user = { id: userId, role };
  }
};
