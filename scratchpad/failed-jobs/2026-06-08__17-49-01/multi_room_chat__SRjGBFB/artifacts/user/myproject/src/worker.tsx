import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { ChatPage } from "@/app/pages/chat";
import { SyncedStateServer, syncedStateRoutes } from "rwsdk/use-synced-state/worker";

export { SyncedStateServer };

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...syncedStateRoutes((env: any) => env.SYNCED_STATE_SERVER),
  render(Document, [
    route("/", Home),
    route("/chat/:roomId", ({ params }) => <ChatPage roomId={params.roomId} />),
  ]),
]);
