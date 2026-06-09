import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { MarketingDocument } from "@/app/marketing-document";
import { AppDocument } from "@/app/app-document";
import { setCommonHeaders } from "@/app/headers";
import { MarketingHome } from "@/app/pages/marketing-home";
import { MarketingPricing } from "@/app/pages/marketing-pricing";
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
  // Raw JSON API route — no Document wrapper
  route("/api/health", {
    get: () => Response.json({ status: "ok" }),
  }),
  // Marketing pages — light theme, no hydration
  render(MarketingDocument, [
    route("/", MarketingHome),
    route("/pricing", MarketingPricing),
  ]),
  // App pages — dark theme, hydration enabled
  render(AppDocument, [
    route("/app", AppDashboard),
    route("/app/profile", AppProfile),
    route("/app/settings", AppSettings),
  ]),
]);