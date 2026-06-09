import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// In-memory file metadata store with pre-computed ETags
// ETag derivation: 'W/"' + size + '-' + sha256(name + ':' + size).hex().slice(0, 16) + '"'
const files: Record<
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

const ALLOW_HEADER = "GET, HEAD, OPTIONS";

function handleGetOrHead(requestInfo: {
  params: Record<string, string>;
  request: Request;
}) {
  const file = files[requestInfo.params.id];

  if (!file) {
    return new Response(null, { status: 404 });
  }

  const body = JSON.stringify({
    id: file.id,
    name: file.name,
    size: file.size,
    contentType: file.contentType,
    etag: file.etag,
  });

  const contentLength = new TextEncoder().encode(body).length.toString();

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("ETag", file.etag);
  headers.set("Content-Length", contentLength);

  if (requestInfo.request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(body, { status: 200, headers });
}

function handleOptions(requestInfo: { params: Record<string, string> }) {
  const file = files[requestInfo.params.id];

  if (!file) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 204,
    headers: { Allow: ALLOW_HEADER },
  });
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },
  route("/api/files/:id", {
    get: handleGetOrHead,
    head: handleGetOrHead,
    custom: {
      options: handleOptions,
    },
    config: {
      disableOptions: true,
    },
  }),
  render(Document, [route("/", Home)]),
]);