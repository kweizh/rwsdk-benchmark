import { prefix, render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { userRoutes } from "@/app/pages/users/routes";

export type AppContext = {};

// Middleware that sets the X-API-Version response header
function setApiVersion(version: string) {
  return ({ response }: { response: { headers: Headers } }) => {
    response.headers.set("X-API-Version", version);
  };
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    // v1 routes — grouped under /v1 with version middleware
    prefix("/v1", [setApiVersion("1"), ...userRoutes]),
    // v2 routes — grouped under /v2 with version middleware
    prefix("/v2", [setApiVersion("2"), ...userRoutes]),
  ]),
]);
