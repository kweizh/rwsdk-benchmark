import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { meHandler, meRoleHandler } from "@/app/pages/me";
import { userContextMiddleware } from "@/app/user-context";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  userContextMiddleware(),
  render(Document, [route("/", Home)]),
  route("/me", meHandler),
  route("/me/role", meRoleHandler),
]);
