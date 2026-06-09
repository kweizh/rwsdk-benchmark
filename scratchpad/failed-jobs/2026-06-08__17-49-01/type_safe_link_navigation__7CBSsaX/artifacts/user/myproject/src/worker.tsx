import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Users } from "@/app/pages/users";
import { UserDetail } from "@/app/pages/userDetail";
import { PostDetail } from "@/app/pages/postDetail";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/users", Users),
    route("/users/:id", ({ params }) => <UserDetail id={params.id} />),
    route("/users/:id/posts/:postId", ({ params }) => <PostDetail id={params.id} postId={params.postId} />),
  ]),
]);
