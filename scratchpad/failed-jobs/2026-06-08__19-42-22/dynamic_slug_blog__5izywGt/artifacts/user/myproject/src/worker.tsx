import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Post } from "@/app/pages/post";
import posts from "@/data/posts.json";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/posts/:slug/raw", ({ params }) => {
    const post = posts.find(p => p.slug === params.slug);
    if (!post) return new Response("Not Found", { status: 404 });
    return new Response(post.body, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }),
  render(Document, [
    route("/", Home),
    route("/posts/:slug", Post),
  ]),
]);
