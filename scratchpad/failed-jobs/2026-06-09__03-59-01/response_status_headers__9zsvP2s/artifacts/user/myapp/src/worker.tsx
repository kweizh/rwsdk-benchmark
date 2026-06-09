import { render, route } from "rwsdk/router";
import { defineApp, requestInfo } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const CachedPage = () => {
  requestInfo.response.status = 200;
  requestInfo.response.headers.set("Cache-Control", "public, max-age=3600");
  requestInfo.response.headers.set("X-Cache-Status", "HIT");
  return <div>cached page</div>;
};

const ForbiddenPage = () => {
  requestInfo.response.status = 403;
  requestInfo.response.headers.set("X-Reason", "forbidden");
  return <div>nope!</div>;
};

const TeapotPage = () => {
  requestInfo.response.status = 418;
  requestInfo.response.headers.set("Content-Language", "en");
  return <div>I am a teapot</div>;
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/cached", CachedPage),
    route("/forbidden", ForbiddenPage),
    route("/teapot", TeapotPage),
    route("/redirect-me", () => {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/cached",
        },
      });
    }),
  ]),
]);
