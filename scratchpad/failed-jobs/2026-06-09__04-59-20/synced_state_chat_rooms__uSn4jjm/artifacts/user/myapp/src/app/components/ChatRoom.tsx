"use client";

import { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [input, setInput] = useState("");

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, trimmed]);
    setInput("");
  }

  function handleClear() {
    setMessages([]);
  }

  return (
    <div>
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "8px", marginBottom: "8px" }}>
        {messages.map((msg, i) => (
          <div key={i} data-testid="chat-message">
            {msg}
          </div>
        ))}
      </div>
      <input
        data-testid="chat-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
      />
      <button data-testid="send-btn" onClick={handleSend}>
        Send
      </button>
      <button data-testid="clear-btn" onClick={handleClear}>
        Clear
      </button>
    </div>
  );
}
