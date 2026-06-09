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
  render(Document, [
    route("/", Home),
    route("/users/:id", ({ params }) => {
      return Response.json(
        { id: params.id },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }),
    route("/users/:id/posts/:postId", ({ params }) => {
      return Response.json(
        { userId: params.id, postId: params.postId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }),
    route("/teams/:teamId/members/:memberId/role", ({ params }) => {
      return Response.json(
        {
          teamId: params.teamId,
          memberId: params.memberId,
          resource: "role",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }),
    route("/files/*/download/*", ({ params }) => {
      return Response.json(
        { prefix: params.$0, suffix: params.$1 },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }),
    route("/files/*", ({ params }) => {
      return Response.json(
        { path: params.$0 },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }),
  ]),
]);
