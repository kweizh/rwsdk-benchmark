import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

function requireBearerToken({ request }: { request: Request }) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== "Bearer secret-token") {
    return new Response("Unauthorized", { status: 401 });
  }
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/public/hello", () => new Response("hello-public", { status: 200 })),
  route("/admin/dashboard", [
    requireBearerToken,
    () => new Response("admin-dashboard-ok", { status: 200 }),
  ]),
  route("/admin/users", [
    requireBearerToken,
    () =>
      new Response(JSON.stringify({ users: ["alice", "bob"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  ]),
  render(Document, [route("/", Home)]),
]);
