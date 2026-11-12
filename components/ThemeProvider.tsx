"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  isDark: false,
  setMode: () => {},
  cycleMode: () => {},
});

const STORAGE_KEY = "shopease-theme-mode";
const MODE_ORDER: ThemeMode[] = ["system", "light", "dark"];

/**
 * Provides theme state ("system" | "light" | "dark") with OS prefers-color-scheme
 * adaptation and localStorage persistence, without requiring global CSS edits.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "system" || saved === "light" || saved === "dark") {
      setModeState(saved);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);

    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function cycleMode() {
    const next = MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];
    setMode(next);
  }

  const isDark = mode === "dark" || (mode === "system" && systemDark);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, cycleMode }}>
      <div
        className={
          isDark
            ? "min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200"
            : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70 text-slate-900 transition-colors duration-200"
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
