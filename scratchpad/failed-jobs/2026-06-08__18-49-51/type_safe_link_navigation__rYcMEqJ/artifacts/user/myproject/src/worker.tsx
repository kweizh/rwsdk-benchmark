import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { UsersPage } from "@/app/pages/users";
import { UserDetailPage } from "@/app/pages/userDetail";
import { PostDetailPage } from "@/app/pages/postDetail";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  render(Document, [
    route("/", Home),
    route("/users", UsersPage),
    route("/users/:id", UserDetailPage),
    route("/users/:id/posts/:postId", PostDetailPage),
  ]),
]);
