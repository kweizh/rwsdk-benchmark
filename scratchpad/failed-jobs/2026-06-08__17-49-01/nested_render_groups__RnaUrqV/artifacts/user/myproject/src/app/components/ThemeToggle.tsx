"use client";

import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button onClick={toggleTheme} className="theme-toggle-btn" style={{ cursor: "pointer" }}>
      Toggle Theme: {theme === "dark" ? "Dark 🌙" : "Light ☀️"}
    </button>
  );
};
