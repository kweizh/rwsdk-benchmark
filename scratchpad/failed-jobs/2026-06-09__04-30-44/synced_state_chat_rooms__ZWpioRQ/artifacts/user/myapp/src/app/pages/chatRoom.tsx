import React from "react";
import { ChatRoom } from "../components/ChatRoom";

export const ChatRoomPage = ({ params }: { params: { roomId: string } }) => {
  return (
    <div>
      <h1>Room: {params.roomId}</h1>
      <ChatRoom roomId={params.roomId} />
    </div>
  );
};
