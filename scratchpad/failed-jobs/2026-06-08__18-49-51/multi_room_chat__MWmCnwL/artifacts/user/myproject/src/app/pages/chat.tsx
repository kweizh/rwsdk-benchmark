"use client";

import { useSyncedState } from "rwsdk/use-synced-state/client";
import { useCallback, useState } from "react";

type Message = {
  id: string;
  text: string;
  timestamp: number;
};

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useSyncedState<Message[]>([], "messages", roomId);
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      const newMessage: Message = {
        id: crypto.randomUUID(),
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...(prev ?? []), newMessage]);
      setInput("");
    },
    [input, setMessages]
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h1>Chat Room: {roomId}</h1>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          minHeight: "300px",
          maxHeight: "500px",
          overflowY: "auto",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
        aria-live="polite"
        aria-label="Message history"
      >
        {(messages ?? []).map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: "0.5rem",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <label htmlFor="message-input" style={{ display: "none" }}>
          message
        </label>
        <input
          id="message-input"
          name="message"
          aria-label="message"
          placeholder="message"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
          autoComplete="off"
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
