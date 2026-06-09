import { render, route, except } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { NotFound } from "@/app/pages/notFound";
import { ServerError } from "@/app/pages/serverError";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },

  render(Document, [
    // Home route
    route("/", Home),

    // HTML 500 handler — catches errors from /boom (declared right after)
    except((_error, requestInfo) => {
      const path = new URL(requestInfo.request.url).pathname;
      if (!path.startsWith("/api/")) {
        requestInfo.response.status = 500;
        return <ServerError />;
      }
      // Not an HTML path — let it bubble up to the API except handler below
    }),

    // Intentionally crashing HTML route
    route("/boom", () => {
      throw new Error("boom sentinel error");
    }),

    // API 500 handler — catches errors from /api/boom (declared right after)
    except((_error, requestInfo) => {
      const path = new URL(requestInfo.request.url).pathname;
      if (path.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "internal_server_error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Not an API path — let it bubble further up
    }),

    // Intentionally crashing API route
    route("/api/boom", () => {
      throw new Error("api boom sentinel error");
    }),

    // Unmatched API routes → JSON 404
    route("/api/*", ({ request }) => {
      const path = new URL(request.url).pathname;
      return new Response(JSON.stringify({ error: "not_found", path }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }),

    // Catch-all HTML 404 for any unmatched route
    route("*", ({ response }) => {
      response.status = 404;
      return <NotFound />;
    }),
  ]),
]);
