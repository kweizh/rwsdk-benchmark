import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

const cronLog: Array<{ cron: string; at: number }> = [];

const app = defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/cron/ping", () => new Response("pong")),
  route("/cron/log", () => Response.json({ entries: cronLog })),
  route("/cron/clear", () => {
    cronLog.length = 0;
    return new Response("cleared");
  }),
  render(Document, [route("/", Home)]),
]);

const scheduled: ExportedHandlerScheduledHandler = (
  controller,
  env,
  ctx,
) => {
  const cron = controller.cron;
  cronLog.push({ cron, at: controller.scheduledTime });
  console.log(`cron processed: ${cron}`);
};

export default { fetch: app.fetch, scheduled };