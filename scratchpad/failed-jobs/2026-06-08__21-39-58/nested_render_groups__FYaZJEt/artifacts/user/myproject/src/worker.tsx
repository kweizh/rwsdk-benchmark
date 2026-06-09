import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { MarketingDocument } from "@/app/marketing-document";
import { AppDocument } from "@/app/app-document";
import { MarketingHome } from "@/app/pages/marketing/home";
import { MarketingPricing } from "@/app/pages/marketing/pricing";
import { AppDashboard } from "@/app/pages/app/dashboard";
import { AppProfile } from "@/app/pages/app/profile";
import { AppSettings } from "@/app/pages/app/settings";

export type AppContext = {};

export default defineApp([
  render(MarketingDocument, [
    route("/", () => <MarketingHome />),
    route("/pricing", () => <MarketingPricing />),
  ]),
  render(AppDocument, [
    route("/app", () => <AppDashboard />),
    route("/app/profile", () => <AppProfile />),
    route("/app/settings", () => <AppSettings />),
  ]),
  route("/api/health", {
    get: () => {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  }),
]);
