import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { SyncedStateServer, syncedStateRoutes } from "rwsdk/use-synced-state/worker";
import { env } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Board } from "@/app/pages/board";

export { SyncedStateServer };

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...syncedStateRoutes((e: any) => e.SYNCED_STATE),
  route("/api/board/:boardId", async ({ params }) => {
    const boardId = params.boardId;
    const namespace = (env as any).SYNCED_STATE;
    const id = namespace.idFromName(boardId);
    const stub = namespace.get(id);
    const dots = (await stub.getState("dots")) || [];
    return Response.json({ dots });
  }),
  render(Document, [
    route("/board/:boardId", ({ params }) => <Board params={params as {boardId: string}} />)
  ]),
]);
