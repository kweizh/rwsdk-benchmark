import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const files = {
  f1: { id: "f1", name: "alpha.txt", size: 100, contentType: "text/plain", etag: 'W/"100-d4639166240069c1"' },
  f2: { id: "f2", name: "beta.png", size: 2048, contentType: "image/png", etag: 'W/"2048-5899b37f0211f372"' },
  f3: { id: "f3", name: "gamma.json", size: 512, contentType: "application/json", etag: 'W/"512-3a0307a756bd191e"' },
};

const fileHandler = ({ request, params }: { request: Request; params: { id: string } }) => {
  const file = files[params.id as keyof typeof files];
  if (!file) return new Response(null, { status: 404 });
  const body = JSON.stringify(file);
  return new Response(request.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "ETag": file.etag,
      "Content-Length": String(new TextEncoder().encode(body).byteLength)
    }
  });
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/api/files/:id", {
    get: fileHandler,
    head: fileHandler,
    custom: {
      options: ({ params }) => {
        const file = files[params.id as keyof typeof files];
        if (!file) return new Response(null, { status: 404 });
        return new Response(null, {
          status: 204,
          headers: {
            "Allow": "GET, HEAD, OPTIONS"
          }
        });
      }
    },
    config: {
      disableOptions: true
    }
  }),
  render(Document, [route("/", Home)]),
]);
