import { ChatRoom } from "@/app/components/ChatRoom";

export function ChatPage({ params }: { params: { roomId: string } }) {
  return (
    <div>
      <h1>Room: {params.roomId}</h1>
      <ChatRoom roomId={params.roomId} />
    </div>
  );
}