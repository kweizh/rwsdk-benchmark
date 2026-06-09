"use client";

import { useRef, useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export const Chat = ({ params }: { params: { roomId: string } }) => {
  const roomId = params.roomId;

  // useSyncedState with roomId scoping — each room gets its own isolated state
  const [messages, setMessages] = useSyncedState<string[]>(
    [],
    "messages",
    roomId,
  );

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, trimmed]);
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      <h1>Chat Room: {roomId}</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          ref={inputRef}
          type="text"
          name="message"
          aria-label="message"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Send
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, i) => (
          <li
            key={i}
            style={{
              padding: "0.5rem",
              borderBottom: "1px solid #eee",
            }}
          >
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
};
