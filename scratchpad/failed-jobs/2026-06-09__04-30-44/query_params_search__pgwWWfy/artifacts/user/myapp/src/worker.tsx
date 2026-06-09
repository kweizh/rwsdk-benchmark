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
  route("/search", ({ request }) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const q = params.get("q") || "";
    const tags = params.getAll("tag");
    
    let page = parseInt(params.get("page") || "", 10);
    if (isNaN(page)) page = 1;
    
    let limit = parseInt(params.get("limit") || "", 10);
    if (isNaN(limit)) {
      limit = 10;
    } else {
      limit = Math.max(1, Math.min(100, limit));
    }
    
    return Response.json({
      q,
      tags,
      page,
      limit
    });
  }),
  route("/echo", ({ request }) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    const result: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      if (!(key in result)) {
        result[key] = value;
      }
    }
    
    return Response.json(result);
  }),
  render(Document, [route("/", Home)]),
]);
