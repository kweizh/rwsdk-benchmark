import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

function handleSearch({ request }: { request: Request }): Response {
  const url = new URL(request.url);
  const params = url.searchParams;

  const q = params.get("q") ?? "";

  const tags = params.getAll("tag");

  const pageRaw = params.get("page");
  const pageNum = pageRaw !== null ? parseInt(pageRaw, 10) : NaN;
  const page = !isNaN(pageNum) ? pageNum : 1;

  const limitRaw = params.get("limit");
  const limitNum = limitRaw !== null ? parseInt(limitRaw, 10) : NaN;
  const limitDefault = 10;
  const limit = isNaN(limitNum)
    ? limitDefault
    : Math.min(100, Math.max(1, limitNum));

  return new Response(JSON.stringify({ q, tags, page, limit }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function handleEcho({ request }: { request: Request }): Response {
  const url = new URL(request.url);
  const result: Record<string, string> = {};
  // URLSearchParams.entries() yields keys in insertion order;
  // we only keep the first occurrence of each key.
  for (const [key, value] of url.searchParams.entries()) {
    if (!(key in result)) {
      result[key] = value;
    }
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/search", handleSearch),
  route("/echo", handleEcho),
  render(Document, [route("/", Home)]),
]);
