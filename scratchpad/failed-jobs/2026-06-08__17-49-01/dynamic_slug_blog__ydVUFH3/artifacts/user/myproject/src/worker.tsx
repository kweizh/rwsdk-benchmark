import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import type { RequestInfo } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { PostDetail } from "@/app/pages/post-detail";
import { escapeHtml, renderMarkdown } from "@/app/utils";
import posts from "@/data/posts.json";

export type AppContext = {
  title?: string;
  description?: string;
  post?: (typeof posts)[number];
  htmlContent?: string;
};

const homeMiddleware = async ({ ctx }: RequestInfo<any, AppContext>) => {
  ctx.title = "My RedwoodSDK Blog";
};

const loadPostMiddleware = async ({ params, ctx }: RequestInfo<any, AppContext>) => {
  const { slug } = params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    return new Response("Not Found", { status: 404 });
  }
  ctx.post = post;
  ctx.title = post.title;
  ctx.description = escapeHtml(post.body.slice(0, 100));
  ctx.htmlContent = await renderMarkdown(post.body);
};

const PostDetailRoute = ({ ctx }: RequestInfo<any, AppContext>) => {
  const { post, htmlContent } = ctx;
  if (!post || !htmlContent) {
    return new Response("Not Found", { status: 404 });
  }
  return <PostDetail post={post} htmlContent={htmlContent} />;
};

const rawPostRoute = async ({ params }: RequestInfo<any, AppContext>) => {
  const { slug } = params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(post.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", [homeMiddleware, Home]),
    route("/posts/:slug", [loadPostMiddleware, PostDetailRoute]),
    route("/posts/:slug/raw", rawPostRoute),
  ]),
]);
