import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const filesDb: Record<
  string,
  { id: string; name: string; size: number; contentType: string; etag: string }
> = {
  f1: {
    id: "f1",
    name: "alpha.txt",
    size: 100,
    contentType: "text/plain",
    etag: 'W/"100-d4639166240069c1"',
  },
  f2: {
    id: "f2",
    name: "beta.png",
    size: 2048,
    contentType: "image/png",
    etag: 'W/"2048-5899b37f0211f372"',
  },
  f3: {
    id: "f3",
    name: "gamma.json",
    size: 512,
    contentType: "application/json",
    etag: 'W/"512-3a0307a756bd191e"',
  },
};

async function fileApiHandler({
  params,
  request,
}: {
  params: { id: string };
  request: Request;
}) {
  const method = request.method.toUpperCase();
  console.log("--- fileApiHandler called ---", method, params.id);
  const allowedMethods = ["GET", "HEAD", "OPTIONS"];

  if (!allowedMethods.includes(method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "GET, HEAD, OPTIONS",
      },
    });
  }

  const { id } = params;
  const file = filesDb[id];

  if (!file) {
    if (method === "HEAD" || method === "OPTIONS") {
      return new Response(null, {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, HEAD, OPTIONS",
      },
    });
  }

  const bodyStr = JSON.stringify(file);
  const contentLength = new TextEncoder().encode(bodyStr).length.toString();

  const headers = {
    "Content-Type": "application/json",
    ETag: file.etag,
    "Content-Length": contentLength,
  };

  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers,
    });
  }

  // method === "GET"
  return new Response(bodyStr, {
    status: 200,
    headers,
  });
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/api/files/:id", fileApiHandler),
  render(Document, [route("/", Home)]),
]);
