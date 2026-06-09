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
  route("/search", function handler({ request }) {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const tags = url.searchParams.getAll("tag");
    const pageParam = parseInt(url.searchParams.get("page") ?? "", 10);
    const page = Number.isNaN(pageParam) ? 1 : pageParam;
    const limitParam = parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.max(1, Math.min(100, limitParam));
    return Response.json({ q, tags, page, limit });
  }),
  route("/echo", function handler({ request }) {
    const url = new URL(request.url);
    const result: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (!(key in result)) {
        result[key] = value;
      }
    });
    return Response.json(result);
  }),
  render(Document, [route("/", Home)]),
]);
