import { render, route } from "rwsdk/router";
import { defineApp, requestInfo } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

const Cached = () => {
  requestInfo.response.status = 200;
  requestInfo.response.headers.set("Cache-Control", "public, max-age=3600");
  requestInfo.response.headers.set("X-Cache-Status", "HIT");
  return <div>cached page</div>;
};

const Forbidden = () => {
  requestInfo.response.status = 403;
  requestInfo.response.headers.set("X-Reason", "forbidden");
  return <div>nope!</div>;
};

const Teapot = () => {
  requestInfo.response.status = 418;
  requestInfo.response.headers.set("Content-Language", "en");
  return <div>I am a teapot</div>;
};

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/redirect-me", () => new Response(null, { status: 302, headers: { Location: "/cached" } })),
  render(Document, [
    route("/", Home),
    route("/cached", Cached),
    route("/forbidden", Forbidden),
    route("/teapot", Teapot)
  ]),
]);
