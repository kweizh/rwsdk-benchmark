import { prefix, render, route } from "rwsdk/router";
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
  prefix("/api/v1", [
    route("/ping", () => {
      return Response.json({ version: "v1", pong: true }, { status: 200 });
    }),
    route("/echo/:msg", ({ params }) => {
      return Response.json({ version: "v1", echo: params.msg }, { status: 200 });
    }),
    route("/users/:id/profile", ({ params }) => {
      return Response.json({ version: "v1", userId: params.id, profile: true }, { status: 200 });
    }),
  ]),
  render(Document, [route("/", Home)]),
]);
