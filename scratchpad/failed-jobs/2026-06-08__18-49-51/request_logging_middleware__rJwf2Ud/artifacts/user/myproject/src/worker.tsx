import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { requestLogger, emitAccessLog } from "@/middleware/requestLogger";
import { pingHandler } from "@/app/api/ping";

export type AppContext = {};

const app = defineApp([
  requestLogger,
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/api/ping", pingHandler),
  render(Document, [route("/", Home)]),
]);

// Wrap the app's fetch so we can observe the final Response status code and
// emit a structured access log line after every request.
export default {
  fetch: async (
    request: Request,
    env: Env,
    cf: ExecutionContext,
  ): Promise<Response> => {
    const startMs = Date.now();
    const response = await app.fetch(request, env, cf);

    // Read requestId from the response header (set by the requestLogger middleware)
    const requestId = response.headers.get("X-Request-Id") ?? "";

    // Schedule log emission via waitUntil so it doesn't block the response
    cf.waitUntil(
      Promise.resolve().then(() => {
        emitAccessLog(request, requestId, response.status, startMs);
      }),
    );

    return response;
  },
};
