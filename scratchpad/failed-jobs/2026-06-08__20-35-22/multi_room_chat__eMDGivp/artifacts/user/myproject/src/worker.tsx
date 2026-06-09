import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { SyncedStateServer, syncedStateRoutes } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { ChatRoom } from "@/app/pages/chat";

export type AppContext = {};

export { SyncedStateServer };

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),
    route("/chat/:roomId", ChatRoom),
    ...syncedStateRoutes((env) => env.syncedState),
  ]),
]);