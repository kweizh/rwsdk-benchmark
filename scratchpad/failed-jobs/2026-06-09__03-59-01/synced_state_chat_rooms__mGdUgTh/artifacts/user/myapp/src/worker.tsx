import { env } from "cloudflare:workers";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { syncedStateRoutes, SyncedStateServer } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { ChatRoom } from "@/app/components/ChatRoom";

export type AppContext = {};

export { SyncedStateServer };

const ChatPage = ({ params }: { params: { roomId: string } }) => {
  const roomId = params.roomId;
  return (
    <div>
      <h1>Room: {roomId}</h1>
      <ChatRoom roomId={roomId} />
    </div>
  );
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  syncedStateRoutes(() => (env as any).SYNCED_STATE_SERVER),
  render(Document, [
    route("/", Home),
    route("/chat/:roomId", ChatPage),
  ]),
]);
