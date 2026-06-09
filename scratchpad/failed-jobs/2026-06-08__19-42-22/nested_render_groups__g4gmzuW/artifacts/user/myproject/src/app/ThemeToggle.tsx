"use client";
import React, { useState, useEffect } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    setTheme(t => t === "dark" ? "light" : "dark");
  };

  return <button onClick={toggle}>Toggle Theme</button>;
}
