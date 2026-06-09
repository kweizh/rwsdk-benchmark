"use client";

import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Set initial theme on body dataset
    document.body.dataset.theme = "dark";
    setTheme("dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    setTheme(next);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <p>
        Current theme: <strong>{theme}</strong>
      </p>
      <button
        onClick={toggleTheme}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          cursor: "pointer",
          background: theme === "dark" ? "#333" : "#eee",
          color: theme === "dark" ? "#fff" : "#111",
          border: "1px solid #666",
          borderRadius: 4,
        }}
      >
        Toggle Theme
      </button>
    </div>
  );
};
