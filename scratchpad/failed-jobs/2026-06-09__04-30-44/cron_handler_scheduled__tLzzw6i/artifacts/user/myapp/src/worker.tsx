import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

let cronLog: { cron: string; at: number }[] = [];

const app = defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/cron/ping", () => {
    return new Response("pong");
  }),
  route("/cron/log", () => {
    return new Response(JSON.stringify({ entries: cronLog }), {
      headers: { "Content-Type": "application/json" }
    });
  }),
  route("/cron/clear", () => {
    cronLog = [];
    return new Response("cleared");
  }),
  render(Document, [route("/", Home)]),
]);

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: any, ctx: ExecutionContext) {
    cronLog.push({ cron: controller.cron, at: controller.scheduledTime });
    console.log(`cron processed: ${controller.cron}`);
  }
};
