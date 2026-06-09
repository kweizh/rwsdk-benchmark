import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// Module-level log of processed cron invocations
const cronLog: Array<{ cron: string; at: string }> = [];

const app = defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/cron/ping", () => new Response("pong", { status: 200 })),
  route("/cron/log", () =>
    Response.json({ entries: cronLog }, { status: 200 })
  ),
  route("/cron/clear", () => {
    cronLog.length = 0;
    return new Response("cleared", { status: 200 });
  }),
  render(Document, [route("/", Home)]),
]);

async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const cron = controller.cron;
  const at = new Date().toISOString();

  cronLog.push({ cron, at });
  console.log(`cron processed: ${cron}`);
}

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Env>;
