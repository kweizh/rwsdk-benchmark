import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { UsersList } from "@/app/pages/users";
import { UserDetail } from "@/app/pages/user-detail";
import { PostDetail } from "@/app/pages/post-detail";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/users", UsersList),
    route("/users/:id", UserDetail),
    route("/users/:id/posts/:postId", PostDetail),
  ]),
]);
