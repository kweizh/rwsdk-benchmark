import { render, route, except, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const PageNotFound = () => {
  return (
    <div>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/">Go back to Home</a>
    </div>
  );
};

const SomethingBroke = () => {
  return (
    <div>
      <h1>Something broke</h1>
      <p>An unexpected error occurred. Please try again later.</p>
    </div>
  );
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  // API routes namespace
  prefix("/api", [
    except(() => {
      return new Response(
        JSON.stringify({ error: "internal_server_error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }),
    route("/boom", () => {
      throw new Error("Intentionally thrown API error");
    }),
    route("/*", (requestInfo) => {
      const pathname = new URL(requestInfo.request.url).pathname;
      return new Response(
        JSON.stringify({ error: "not_found", path: pathname }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }),
  ]),
  // HTML routes
  render(Document, [
    except((_error, requestInfo) => {
      requestInfo.response.status = 500;
      return <SomethingBroke />;
    }),
    route("/", Home),
    route("/boom", () => {
      throw new Error("Intentionally thrown HTML error");
    }),
    route("*", (requestInfo) => {
      requestInfo.response.status = 404;
      return <PageNotFound />;
    }),
  ]),
]);
