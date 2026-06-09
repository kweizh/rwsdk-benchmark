"use client";

import { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setMessages((prev: string[]) => [...prev, trimmed]);
      setInputValue("");
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div>
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "8px",
          marginBottom: "8px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} data-testid="chat-message">
            {msg}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          data-testid="chat-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button data-testid="send-btn" onClick={handleSend}>
          Send
        </button>
        <button data-testid="clear-btn" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}