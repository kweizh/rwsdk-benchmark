import { render, route, except, prefix } from "rwsdk/router";
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

  // API namespace
  ...prefix("/api", [
    except((error, requestInfo) => {
      return new Response(JSON.stringify({ error: "internal_server_error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }),
    route("/boom", () => {
      throw new Error("API Boom");
    }),
    route("*", (requestInfo) => {
      return new Response(JSON.stringify({ error: "not_found", path: new URL(requestInfo.request.url).pathname }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }),
  ]),

  // HTML namespace
  render(Document, [
    except((error, requestInfo) => {
      requestInfo.response.status = 500;
      return (
        <div>
          <h1>Something broke</h1>
        </div>
      );
    }),
    route("/", Home),
    route("/boom", () => {
      throw new Error("HTML Boom");
    }),
    route("*", (requestInfo) => {
      requestInfo.response.status = 404;
      return (
        <div>
          <h1>Page not found</h1>
          <a href="/">Go home</a>
        </div>
      );
    })
  ]),
]);
