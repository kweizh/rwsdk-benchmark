"use client";

import React, { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export const ChatRoom = ({ roomId }: { roomId: string }) => {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages((prev) => [...(prev || []), inputValue]);
      setInputValue("");
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {messages?.map((msg, idx) => (
          <div key={idx} data-testid="chat-message">
            {msg}
          </div>
        ))}
      </div>
      <input
        data-testid="chat-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button data-testid="send-btn" onClick={handleSend}>
        Send
      </button>
      <button data-testid="clear-btn" onClick={handleClear}>
        Clear
      </button>
    </div>
  );
};
