"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "degener8-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const theme = stored ?? "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  if (!mounted) return <>{children}</>;
  return <>{children}</>;
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "dark";
}
