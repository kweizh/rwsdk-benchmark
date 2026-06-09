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
  render(Document, [route("/", Home)]),
]);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/cron/log") {
      return new Response(JSON.stringify({ entries: cronLog }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.pathname === "/cron/clear") {
      cronLog.length = 0;
      return new Response("cleared", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
    if (url.pathname === "/cron/ping") {
      return new Response("pong", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
    return app.fetch(request, env, ctx);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Dispatch based on controller.cron
    switch (controller.cron) {
      case "* * * * *":
        console.log("Handling * * * * * schedule");
        break;
      case "0 * * * *":
        console.log("Handling 0 * * * * schedule");
        break;
      case "0 21 * * *":
        console.log("Handling 0 21 * * * schedule");
        break;
      default:
        console.log(`Handling default/unknown schedule: ${controller.cron}`);
        break;
    }

    // Append record to module-level array
    cronLog.push({
      cron: controller.cron,
      at: controller.scheduledTime,
    });

    // Log the processed cron
    console.log(`cron processed: ${controller.cron}`);
  }
};
