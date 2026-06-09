import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { syncedStateRoutes, SyncedStateServer } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { ChatRoomPage } from "@/app/pages/chatRoom";

export type AppContext = {};

export { SyncedStateServer };

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  syncedStateRoutes((env: any) => env.SYNCED_STATE_SERVER),
  render(Document, [
    route("/", Home),
    route("/chat/:roomId", ChatRoomPage)
  ]),
]);
