import { render, route } from "rwsdk/router";
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
  route("/users/:id", ({ params }) =>
    Response.json({ id: params.id }),
  ),
  route("/users/:id/posts/:postId", ({ params }) =>
    Response.json({ userId: params.id, postId: params.postId }),
  ),
  route("/teams/:teamId/members/:memberId/role", ({ params }) =>
    Response.json({ teamId: params.teamId, memberId: params.memberId, resource: "role" }),
  ),
  route("/files/*/download/*", ({ params }) =>
    Response.json({ prefix: params.$0, suffix: params.$1 }),
  ),
  route("/files/*", ({ params }) =>
    Response.json({ path: params.$0 }),
  ),
  render(Document, [route("/", Home)]),
]);
