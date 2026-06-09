"use client";

import { useState, useEffect } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        marginTop: "1rem",
        padding: "0.5rem 1rem",
        cursor: "pointer",
        borderRadius: "4px",
        border: "1px solid #555",
        background: theme === "dark" ? "#333" : "#ddd",
        color: theme === "dark" ? "#e0e0e0" : "#1a1a1a",
      }}
    >
      Toggle theme (current: {theme})
    </button>
  );
};