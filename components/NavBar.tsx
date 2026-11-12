"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme, type ThemeMode } from "./ThemeProvider";

const NAV_LINKS = [
  { href: "/", label: "Support chat" },
  { href: "/orders", label: "My Orders" },
  { href: "/returns", label: "My Returns" },
  { href: "/admin/tickets", label: "Tickets" },
];

type HealthState = {
  ok: boolean;
  settings: Record<string, boolean>;
};

const THEME_LABELS: Record<ThemeMode, string> = {
  system: "Auto",
  light: "Light",
  dark: "Dark",
};

/**
 * Shared top navigation bar for ShopEase pages with adaptive theme switcher,
 * live env health indicator, route links, and logout action.
 */
export default function NavBar() {
  const pathname = usePathname();
  const { mode, isDark, cycleMode } = useTheme();
  const [health, setHealth] = useState<HealthState | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active && typeof data?.ok === "boolean") setHealth(data);
      })
      .catch(() => {
        // Ignore transient health-check failures in UI badge.
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const missingKeys = health
    ? Object.entries(health.settings ?? {})
        .filter(([, ok]) => !ok)
        .map(([key]) => key)
    : [];

  return (
    <header
      className={
        isDark
          ? "mb-4 space-y-3 border-b border-slate-800 pb-3.5"
          : "mb-4 space-y-3 border-b border-slate-200/90 pb-3.5"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
              SE
            </span>
            <h1 className="text-base font-semibold leading-snug sm:text-xl">
              ShopEase · Customer support agent
            </h1>
            {health && (
              <span
                className={
                  health.ok
                    ? isDark
                      ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                      : "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    : isDark
                      ? "inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                      : "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${health.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
                {health.ok ? "Live DB & AI" : "Setup needed"}
              </span>
            )}
          </div>
          <p className={isDark ? "mt-0.5 text-xs text-slate-400 sm:text-sm" : "mt-0.5 text-xs text-slate-500 sm:text-sm"}>
            Logged in as Priya Raman (C001)
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={cycleMode}
            title={`Theme: ${THEME_LABELS[mode]} (click to switch)`}
            className={
              isDark
                ? "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800"
                : "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-100"
            }
          >
            <span aria-hidden="true">{isDark ? "☾" : "☀"}</span>
            <span>{THEME_LABELS[mode]}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className={
              isDark
                ? "min-h-[44px] rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                : "min-h-[44px] rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }
          >
            Log out
          </button>
        </div>
      </div>

      {missingKeys.length > 0 && (
        <div
          className={
            isDark
              ? "rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
              : "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          }
        >
          Missing in <code className="font-mono font-semibold">.env.local</code>:{" "}
          <span className="font-mono">{missingKeys.join(", ")}</span>. Fill them in and restart{" "}
          <code className="font-mono">npm run dev</code> to load live Supabase &amp; Gemini data.
        </div>
      )}

      <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
        {NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? isDark
                    ? "inline-flex min-h-[44px] items-center rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm"
                    : "inline-flex min-h-[44px] items-center rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm"
                  : isDark
                    ? "inline-flex min-h-[44px] items-center rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                    : "inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
