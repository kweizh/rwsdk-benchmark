"use client";

import { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

interface ChatRoomProps {
  roomId: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [inputVal, setInputVal] = useState("");

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages((prev) => [...(prev || []), inputVal]);
    setInputVal("");
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div
        style={{
          overflowY: "auto",
          height: "300px",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "4px",
          backgroundColor: "#f9f9f9"
        }}
      >
        {(messages || []).map((msg, idx) => (
          <div
            key={idx}
            data-testid="chat-message"
            style={{
              padding: "6px 10px",
              margin: "4px 0",
              borderRadius: "4px",
              backgroundColor: "#fff",
              border: "1px solid #eee"
            }}
          >
            {msg}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          data-testid="chat-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        />
        <button
          data-testid="send-btn"
          onClick={handleSend}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
        <button
          data-testid="clear-btn"
          onClick={handleClear}
          style={{
            padding: "8px 16px",
            backgroundColor: "#eaeaea",
            color: "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
