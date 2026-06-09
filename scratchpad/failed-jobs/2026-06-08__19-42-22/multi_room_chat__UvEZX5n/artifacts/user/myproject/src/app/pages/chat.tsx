"use client";

import { useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export function ChatClient({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useSyncedState<string[]>([], "messages", roomId);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...(messages || []), input]);
    setInput("");
  };

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <ul>
        {(messages || []).map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="message"
          aria-label="message"
          name="message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
