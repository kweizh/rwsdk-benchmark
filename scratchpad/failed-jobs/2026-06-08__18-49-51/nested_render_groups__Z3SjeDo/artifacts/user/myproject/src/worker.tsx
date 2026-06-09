import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { MarketingDocument } from "@/app/marketing-document";
import { AppDocument } from "@/app/app-document";
import { setCommonHeaders } from "@/app/headers";

import { MarketingHome } from "@/app/pages/marketing/home";
import { Pricing } from "@/app/pages/marketing/pricing";

import { Dashboard } from "@/app/pages/app/dashboard";
import { Profile } from "@/app/pages/app/profile";
import { Settings } from "@/app/pages/app/settings";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },

  // Raw JSON API route — NOT wrapped in any Document
  route("/api/health", {
    get: () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  }),

  // Marketing pages — wrapped in MarketingDocument (no client bundle)
  render(MarketingDocument, [
    route("/", MarketingHome),
    route("/pricing", Pricing),
  ]),

  // App shell pages — wrapped in AppDocument (includes client bundle)
  render(AppDocument, [
    route("/app", Dashboard),
    route("/app/profile", Profile),
    route("/app/settings", Settings),
  ]),
]);
