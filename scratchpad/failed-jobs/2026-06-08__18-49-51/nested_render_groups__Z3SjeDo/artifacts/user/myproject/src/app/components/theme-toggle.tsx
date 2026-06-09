"use client";

import { useState, useEffect } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Set initial theme on body
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.dataset.theme = next;
  };

  return (
    <button className="theme-toggle-btn" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
};
