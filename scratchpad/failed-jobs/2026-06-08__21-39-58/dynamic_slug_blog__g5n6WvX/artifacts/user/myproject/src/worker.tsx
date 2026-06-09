import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { PostDetail } from "@/app/pages/post-detail";
import { PostRaw } from "@/app/pages/post-raw";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/", Home),
  route("/posts/:slug", PostDetail),
  route("/posts/:slug/raw", PostRaw),
  render(Document, []),
]);
