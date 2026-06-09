import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

interface CronEntry {
  cron: string;
  at: number;
}

const cronLog: CronEntry[] = [];

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

function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): void {
  const entry: CronEntry = { cron: controller.cron, at: Date.now() };
  cronLog.push(entry);
  console.log(`cron processed: ${controller.cron}`);
}

export default {
  fetch: app.fetch,
  scheduled,
};
