import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { SalesReportPage, QuickReportPage } from "@/app/pages/reports";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/reports/sales", SalesReportPage),
    route("/reports/quick", QuickReportPage),
    route("/reports/json", {
      get: () => new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    }),
  ]),
]);
