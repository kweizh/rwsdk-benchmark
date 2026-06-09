import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// ---------------------------------------------------------------------------
// In-memory file metadata store
// ---------------------------------------------------------------------------

interface FileEntry {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

const FILES: Record<string, FileEntry> = {
  f1: { id: "f1", name: "alpha.txt", size: 100, contentType: "text/plain" },
  f2: { id: "f2", name: "beta.png", size: 2048, contentType: "image/png" },
  f3: { id: "f3", name: "gamma.json", size: 512, contentType: "application/json" },
};

const ALLOW = "GET, HEAD, OPTIONS";

/**
 * Derive ETag: W/"<size>-<sha256(name:size).hex().slice(0,16)>"
 *
 * Uses the Web Crypto API (available in Cloudflare Workers / workerd).
 */
async function deriveEtag(entry: FileEntry): Promise<string> {
  const input = `${entry.name}:${entry.size}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `W/"${entry.size}-${hex.slice(0, 16)}"`;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/** Shared handler for GET and HEAD. HEAD callers receive an empty body. */
async function handleGetOrHead({ request, params }: { request: Request; params: Record<string, string> }): Promise<Response> {
  const entry = FILES[params.id];

  if (!entry) {
    // 404 — for HEAD the body must be empty
    if (request.method === "HEAD") {
      return new Response(null, { status: 404 });
    }
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const etag = await deriveEtag(entry);
  const body = JSON.stringify({ id: entry.id, name: entry.name, size: entry.size, contentType: entry.contentType, etag });
  const contentLength = String(new TextEncoder().encode(body).byteLength);

  const headers = new Headers({
    "Content-Type": "application/json",
    "ETag": etag,
    "Content-Length": contentLength,
  });

  // HEAD: same headers, empty body
  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(body, { status: 200, headers });
}

async function handleOptions({ params }: { params: Record<string, string> }): Promise<Response> {
  const entry = FILES[params.id];

  if (!entry) {
    return new Response(null, { status: 404, headers: { Allow: ALLOW } });
  }

  return new Response(null, { status: 204, headers: { Allow: ALLOW } });
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/api/files/:id", {
    get: handleGetOrHead,
    head: handleGetOrHead,
    config: { disableOptions: true },
    custom: { options: handleOptions },
  }),
  render(Document, [route("/", Home)]),
]);
