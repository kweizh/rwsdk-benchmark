import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { requireBearerToken } from "@/app/interruptors";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// Public routes
const publicRoutes = [
  route("/public/hello", () => new Response("hello-public", { status: 200 })),
];

// Protected admin routes (require Bearer token)
const adminRoutes = [
  route("/admin/dashboard", [
    requireBearerToken,
    () => new Response("admin-dashboard-ok", { status: 200 }),
  ]),
  route("/admin/users", [
    requireBearerToken,
    () =>
      Response.json({ users: ["alice", "bob"] }, { status: 200 }),
  ]),
];

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    ...publicRoutes,
    ...adminRoutes,
  ]),
]);
