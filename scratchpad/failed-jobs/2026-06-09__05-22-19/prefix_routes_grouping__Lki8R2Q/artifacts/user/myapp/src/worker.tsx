import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [route("/", Home)]),
  ...prefix("/api/v1", [
    route("/ping", function handler() {
      return Response.json({ version: "v1", pong: true }, { status: 200 });
    }),
    route("/echo/:msg", function handler({ params }) {
      return Response.json({ version: "v1", echo: params.msg }, { status: 200 });
    }),
    route("/users/:id/profile", function handler({ params }) {
      return Response.json({ version: "v1", userId: params.id, profile: true }, { status: 200 });
    }),
  ]),
]);
