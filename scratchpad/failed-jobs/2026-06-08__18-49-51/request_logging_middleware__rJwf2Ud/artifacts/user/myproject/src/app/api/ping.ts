import type { RouteMiddleware } from "rwsdk/router";

export const pingHandler: RouteMiddleware = () => {
  return new Response(JSON.stringify({ pong: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
