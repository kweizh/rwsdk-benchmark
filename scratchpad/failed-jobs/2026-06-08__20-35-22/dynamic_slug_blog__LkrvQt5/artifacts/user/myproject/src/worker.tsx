import { route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { setCommonHeaders } from "@/app/headers";
import { blogIndex, blogDetail, blogRaw } from "@/app/pages/blog";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  route("/", blogIndex),
  route("/posts/:slug/raw", blogRaw),
  route("/posts/:slug", blogDetail),
]);