import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { MarketingDocument, AppDocument } from "@/app/documents";
import { Home, Pricing, AppHome, AppProfile, AppSettings } from "@/app/pages/pages";

export type AppContext = {};

export default defineApp([
  route("/api/health", { 
    get: () => new Response(JSON.stringify({ status: "ok" }), { 
      headers: { "Content-Type": "application/json" } 
    }) 
  }),
  render(MarketingDocument, [
    route("/", Home),
    route("/pricing", Pricing),
  ]),
  render(AppDocument, [
    route("/app", AppHome),
    route("/app/profile", AppProfile),
    route("/app/settings", AppSettings),
  ]),
]);
