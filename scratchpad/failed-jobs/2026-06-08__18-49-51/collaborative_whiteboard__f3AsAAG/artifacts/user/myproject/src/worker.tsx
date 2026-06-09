import { env } from "cloudflare:workers";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { SyncedStateServer, syncedStateRoutes } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { BoardPage } from "@/app/pages/board";

export { SyncedStateServer };

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },
  ...syncedStateRoutes(() => (env as any).SYNCED_STATE),
  route("/api/board/:boardId", async ({ params }) => {
    const boardId = params.boardId as string;
    const ns = (env as any).SYNCED_STATE as DurableObjectNamespace<SyncedStateServer>;
    const id = ns.idFromName(boardId);
    const stub = ns.get(id);
    const dots = (await stub.getState("dots")) ?? [];
    return new Response(JSON.stringify({ dots }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
  render(Document, [
    route("/", Home),
    route("/board/:boardId", BoardPage),
  ]),
]);
