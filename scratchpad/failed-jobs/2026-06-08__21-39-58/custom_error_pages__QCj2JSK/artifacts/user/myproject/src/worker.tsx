import { render, route, except } from "rwsdk/router";
import { defineApp, requestInfo } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { NotFound } from "@/app/pages/not-found";
import { ServerError } from "@/app/pages/server-error";

export type AppContext = {};

/**
 * A sentinel error message used by /boom and /api/boom to trigger 500 handling.
 * This exact string must NOT leak into the rendered response body.
 */
const BOOM_MESSAGE = "BOOM_SENTINEL_DO_NOT_LEAK";

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },

  // ── HTML routes (rendered inside Document) ──
  render(Document, [
    // Specific HTML routes first
    route("/", () => <Home />),

    // /boom: intentionally throws to exercise the HTML 500 error path
    route("/boom", () => {
      throw new Error(BOOM_MESSAGE);
    }),

    // Catch-all for unmatched HTML paths → 404
    route("*", ({ response }) => {
      response.status = 404;
      return <NotFound />;
    }),

    // except handler that catches errors thrown inside the render group
    except((error: unknown, { response }) => {
      console.error("HTML error caught:", error);
      response.status = 500;
      return <ServerError />;
    }),
  ]),

  // ── JSON API routes (raw Response handlers) ──
  // /api/boom: intentionally throws to exercise the JSON 500 error path
  route("/api/boom", () => {
    throw new Error(BOOM_MESSAGE);
  }),

  // Catch-all for unmatched /api/* paths → JSON 404
  route("/api/*", ({ params }) => {
    const path = "/api/" + params.$0;
    return new Response(
      JSON.stringify({ error: "not_found", path }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),

  // except handler that catches errors from the JSON API routes
  except((error: unknown) => {
    console.error("API error caught:", error);
    return new Response(
      JSON.stringify({ error: "internal_server_error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),
]);
