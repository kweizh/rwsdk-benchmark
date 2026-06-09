import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { SyncedStateServer, syncedStateRoutes } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { ChatRoom } from "@/app/pages/chat";

export { SyncedStateServer };

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...syncedStateRoutes((env) => env.SYNCED_STATE),
  render(Document, [
    route("/", Home),
    route("/chat/:roomId", ({ params }) => (
      <ChatRoom roomId={params.roomId} />
    )),
  ]),
]);
