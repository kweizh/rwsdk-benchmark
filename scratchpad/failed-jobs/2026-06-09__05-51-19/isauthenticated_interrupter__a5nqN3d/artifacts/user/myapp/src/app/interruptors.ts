import { RouteMiddleware } from "rwsdk/router";

export const requireBearerToken: RouteMiddleware = ({ request }) => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || authHeader !== "Bearer secret-token") {
    return new Response("Unauthorized", { status: 401 });
  }
};
