// src/components/ThemeToggle.js
"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render actual UI after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md bg-white dark:bg-slate-800"
        aria-label="Toggle theme"
      >
        🌓
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 hover:shadow-sm"
      aria-label="Toggle theme"
    >
      {isDark ? "🌙" : "🌤️"}
    </button>
  );
}
