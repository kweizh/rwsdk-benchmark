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
  // Dynamic parameter route: /users/:id
  route("/users/:id", ({ params }) => {
    return Response.json({ id: params.id });
  }),
  // Dynamic parameter route: /users/:id/posts/:postId
  route("/users/:id/posts/:postId", ({ params }) => {
    return Response.json({ userId: params.id, postId: params.postId });
  }),
  // Dynamic parameter route: /teams/:teamId/members/:memberId/role
  route("/teams/:teamId/members/:memberId/role", ({ params }) => {
    return Response.json({
      teamId: params.teamId,
      memberId: params.memberId,
      resource: "role",
    });
  }),
  // Wildcard route: /files/*/download/* (must come before /files/*)
  route("/files/*/download/*", ({ params }) => {
    return Response.json({ prefix: params.$0, suffix: params.$1 });
  }),
  // Wildcard route: /files/*
  route("/files/*", ({ params }) => {
    return Response.json({ path: params.$0 });
  }),
  render(Document, [route("/", Home)]),
]);
