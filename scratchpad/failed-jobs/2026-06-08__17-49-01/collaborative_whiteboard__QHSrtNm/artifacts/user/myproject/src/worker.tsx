import { env } from "cloudflare:workers";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { syncedStateRoutes, SyncedStateServer as BaseSyncedStateServer } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { BoardPage } from "@/app/pages/BoardPage";

export type AppContext = {};

// Subclass SyncedStateServer to expose getState over HTTP fetch.
export class SyncedStateServer extends BaseSyncedStateServer {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/api-get-dots") {
      const dots = this.getState("dots") || [];
      return new Response(JSON.stringify({ dots }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return super.fetch(request);
  }
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...syncedStateRoutes((env) => env.syncedState),
  render(Document, [
    route("/", Home),
    route("/board/:boardId", ({ params }) => <BoardPage boardId={params.boardId} />),
  ]),
  route("/api/board/:boardId", async ({ params }) => {
    try {
      const boardId = params.boardId;
      const namespace = env.syncedState;
      const id = namespace.idFromName(boardId);
      const stub = namespace.get(id);
      const response = await stub.fetch("http://local/api-get-dots");
      const data = await response.json();
      return Response.json(data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Failed to fetch dots" }, { status: 500 });
    }
  }),
]);
