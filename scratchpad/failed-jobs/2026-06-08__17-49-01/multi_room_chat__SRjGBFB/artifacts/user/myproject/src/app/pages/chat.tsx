"use client";

import { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

interface ChatPageProps {
  roomId: string;
}

export const ChatPage = ({ roomId }: ChatPageProps) => {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed) {
      setMessages((prev) => [...(prev || []), trimmed]);
      setInputVal("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Chat Room: {roomId}</h2>
      
      <div 
        style={{ 
          border: "1px solid #ccc", 
          borderRadius: "4px", 
          padding: "15px", 
          height: "400px", 
          overflowY: "auto", 
          marginBottom: "20px",
          background: "#f9f9f9"
        }}
      >
        {(!messages || messages.length === 0) ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>No messages yet. Send one to start the conversation!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: "8px 12px", 
                  background: "#fff", 
                  border: "1px solid #eee", 
                  borderRadius: "4px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              >
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          name="message"
          aria-label="message"
          placeholder="Type a message..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          style={{ 
            flex: 1, 
            padding: "10px", 
            borderRadius: "4px", 
            border: "1px solid #ccc",
            fontSize: "16px"
          }}
        />
        <button 
          type="submit"
          style={{ 
            padding: "10px 20px", 
            background: "#0070f3", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
