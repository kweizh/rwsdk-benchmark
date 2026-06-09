import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { HomePage } from "@/app/pages/home";
import { UsersPage } from "@/app/pages/users";
import { UserDetailPage } from "@/app/pages/user-detail";
import { PostDetailPage } from "@/app/pages/post-detail";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", HomePage),
    route("/users", UsersPage),
    route("/users/:id", UserDetailPage),
    route("/users/:id/posts/:postId", PostDetailPage),
  ]),
]);