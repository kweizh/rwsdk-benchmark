"use client";

import { useSyncedState } from "rwsdk/use-synced-state/client";
import { useState } from "react";

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed === "") return;
    setMessages([...messages, trimmed]);
    setInputValue("");
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div>
      <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "8px", marginBottom: "8px" }}>
        {messages.map((msg, i) => (
          <div key={i} data-testid="chat-message">
            {msg}
          </div>
        ))}
      </div>
      <input
        data-testid="chat-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
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
