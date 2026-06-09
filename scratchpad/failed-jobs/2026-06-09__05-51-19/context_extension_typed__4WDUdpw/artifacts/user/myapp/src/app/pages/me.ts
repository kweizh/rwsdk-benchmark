import type { RequestInfo } from "rwsdk/worker";

export const meHandler = ({ ctx }: RequestInfo) => {
  const body = JSON.stringify({
    user: ctx.user ?? null,
    requestId: ctx.requestId,
  });
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
  });
};

export const meRoleHandler = ({ ctx }: RequestInfo) => {
  const role = ctx.user?.role ?? "anonymous";
  return new Response(role, {
    headers: { "Content-Type": "text/plain" },
  });
};
