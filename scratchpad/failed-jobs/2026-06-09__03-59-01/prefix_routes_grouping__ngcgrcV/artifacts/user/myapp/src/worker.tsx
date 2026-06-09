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
  prefix("/api/v1", [
    route("/ping", () => Response.json({ version: "v1", pong: true })),
    route("/echo/:msg", ({ params }) => Response.json({ version: "v1", echo: params.msg })),
    route("/users/:id/profile", ({ params }) => Response.json({ version: "v1", userId: params.id, profile: true })),
  ]),
  render(Document, [route("/", Home)]),
]);
