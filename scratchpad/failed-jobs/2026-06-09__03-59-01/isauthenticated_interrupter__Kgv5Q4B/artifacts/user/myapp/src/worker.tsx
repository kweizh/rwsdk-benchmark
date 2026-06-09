import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const authInterrupter = ({ request }: { request: Request }) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== "Bearer secret-token") {
    return new Response("Unauthorized", { status: 401 });
  }
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/public/hello", () => new Response("hello-public", { status: 200 })),
    route("/admin/dashboard", [
      authInterrupter,
      () => new Response("admin-dashboard-ok", { status: 200 }),
    ]),
    route("/admin/users", [
      authInterrupter,
      () => Response.json({ users: ["alice", "bob"] }, { status: 200 }),
    ]),
  ]),
]);
