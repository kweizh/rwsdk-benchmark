import { render, route, layout, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { AppLayout } from "@/app/layouts/AppLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";
import { Home } from "@/app/pages/home";
import { About } from "@/app/pages/about";
import { AdminDashboard } from "@/app/pages/admin/dashboard";
import { AdminUsers } from "@/app/pages/admin/users";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(
    Document,
    layout(AppLayout, [
      route("/", Home),
      route("/about", About),
      layout(AdminLayout, [
        ...prefix("/admin", [
          route("/dashboard", AdminDashboard),
          route("/users", AdminUsers),
        ]),
      ]),
    ]),
  ),
]);