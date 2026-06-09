import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const authInterrupter = ({ request }: { request: Request }) => {
  const auth = request.headers.get("Authorization");
  if (auth !== "Bearer secret-token") {
    return new Response("Unauthorized", { status: 401 });
  }
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/public/hello", () => new Response("hello-public")),
  route("/admin/dashboard", [
    authInterrupter,
    () => new Response("admin-dashboard-ok")
  ]),
  route("/admin/users", [
    authInterrupter,
    () => Response.json({ users: ["alice", "bob"] })
  ]),
  render(Document, [route("/", Home)]),
]);
