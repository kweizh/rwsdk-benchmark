import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { MarketingDocument, AppDocument } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Pricing } from "@/app/pages/pricing";
import { AppDashboard } from "@/app/pages/app-dashboard";
import { AppProfile } from "@/app/pages/app-profile";
import { AppSettings } from "@/app/pages/app-settings";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  // Marketing section (pure server-rendered HTML)
  render(MarketingDocument, [
    route("/", Home),
    route("/pricing", Pricing),
  ]),
  // Application section (hydrated client bundle, dark theme)
  render(AppDocument, [
    route("/app", AppDashboard),
    route("/app/profile", AppProfile),
    route("/app/settings", AppSettings),
  ]),
  // Raw API route (bypasses Document wrappers completely)
  route("/api/health", {
    get: () => new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  }),
]);
