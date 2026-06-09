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
  route("/search", {
    get: ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get("q") ?? "";

      const tags = url.searchParams.getAll("tag");

      const pageRaw = url.searchParams.get("page");
      let page = 1;
      if (pageRaw !== null) {
        const parsed = parseInt(pageRaw, 10);
        if (!isNaN(parsed)) {
          page = parsed;
        }
      }

      const limitRaw = url.searchParams.get("limit");
      let limit = 10;
      if (limitRaw !== null) {
        const parsed = parseInt(limitRaw, 10);
        if (!isNaN(parsed)) {
          limit = parsed;
        }
      }
      limit = Math.max(1, Math.min(100, limit));

      return Response.json({ q, tags, page, limit });
    },
  }),
  route("/echo", {
    get: ({ request }) => {
      const url = new URL(request.url);
      const result: Record<string, string> = {};
      for (const [key, value] of url.searchParams) {
        if (!(key in result)) {
          result[key] = value;
        }
      }
      return Response.json(result);
    },
  }),
  render(Document, [route("/", Home)]),
]);
