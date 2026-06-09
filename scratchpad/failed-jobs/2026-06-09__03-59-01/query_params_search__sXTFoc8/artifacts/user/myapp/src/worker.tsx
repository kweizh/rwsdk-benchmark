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
  render(Document, [
    route("/", Home),
    route("/search", {
      get: ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") ?? "";
        const tags = url.searchParams.getAll("tag");

        const pageStr = url.searchParams.get("page")?.trim();
        let page = 1;
        if (pageStr !== undefined && /^[+-]?\d+$/.test(pageStr)) {
          page = parseInt(pageStr, 10);
        }

        const limitStr = url.searchParams.get("limit")?.trim();
        let limit = 10;
        if (limitStr !== undefined && /^[+-]?\d+$/.test(limitStr)) {
          const parsedLimit = parseInt(limitStr, 10);
          limit = Math.max(1, Math.min(100, parsedLimit));
        }

        return Response.json({ q, tags, page, limit });
      },
    }),
    route("/echo", {
      get: ({ request }) => {
        const url = new URL(request.url);
        const echoObj: Record<string, string> = {};
        for (const [key, value] of url.searchParams.entries()) {
          if (!(key in echoObj)) {
            echoObj[key] = value;
          }
        }
        return Response.json(echoObj);
      },
    }),
  ]),
]);
