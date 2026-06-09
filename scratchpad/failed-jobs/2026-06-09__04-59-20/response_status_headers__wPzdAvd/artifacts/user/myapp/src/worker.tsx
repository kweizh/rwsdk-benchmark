import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Cached } from "@/app/pages/cached";
import { Forbidden } from "@/app/pages/forbidden";
import { Teapot } from "@/app/pages/teapot";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/cached", Cached),
    route("/forbidden", Forbidden),
    route("/teapot", Teapot),
  ]),
  route("/redirect-me", () => {
    return new Response(null, {
      status: 302,
      headers: { Location: "/cached" },
    });
  }),
]);
