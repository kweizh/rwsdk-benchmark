import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { SalesRoute, QuickRoute } from "@/app/pages/reports";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/reports/json", {
    get: () => new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    })
  }),
  render(Document, [
    route("/", Home),
    route("/reports/sales", SalesRoute),
    route("/reports/quick", QuickRoute)
  ]),
]);
