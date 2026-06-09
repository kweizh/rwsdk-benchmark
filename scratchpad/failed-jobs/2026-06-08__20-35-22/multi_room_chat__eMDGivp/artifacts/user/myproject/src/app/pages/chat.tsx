"use client";

import { useState, useCallback } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

interface ChatRoomProps {
  params: { roomId: string };
}

export const ChatRoom = ({ params }: ChatRoomProps) => {
  const { roomId } = params;
  const [messages, setMessages] = useSyncedState<string[]>(
    [],
    "messages",
    roomId
  );
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed === "") return;
      setMessages((prev: string[]) => [...prev, trimmed]);
      setInputValue("");
    },
    [inputValue, setMessages]
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Chat Room: {roomId}</h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: 10,
          height: 400,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ padding: "4px 0" }}>
            {msg}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          name="message"
          aria-label="message"
          placeholder="message"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Send
        </button>
      </form>
    </div>
  );
};