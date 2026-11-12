"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";

export type ToastTone = "error" | "warning" | "info" | "success";

export type AppNotification = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
};

/**
 * Converts raw HTTP / HTML / JSON / network errors into clean, user-friendly
 * in-app notification messages without exposing raw HTML or stack traces.
 */
export function toSmartAppError(raw: unknown, status?: number): { title: string; message: string } {
  const text = raw instanceof Error ? raw.message : typeof raw === "string" ? raw : "";
  const lower = text.toLowerCase();

  if (status === 401 || lower.includes("not logged in") || lower.includes("unauthorized")) {
    return {
      title: "Session expired",
      message: "Please log in again with your ShopEase passcode to continue.",
    };
  }

  if (
    lower.includes("<!doctype") ||
    lower.includes("<html") ||
    lower.includes("unexpected token '<'") ||
    lower.includes("is not valid json")
  ) {
    return {
      title: "Temporary server issue",
      message: "ShopEase servers returned an unexpected response. Please try again in a moment.",
    };
  }

  if (status === 429 || lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return {
      title: "AI assistant busy",
      message: "Too many requests right now. Please wait a few seconds and try again.",
    };
  }

  if (
    status === 503 ||
    status === 504 ||
    lower.includes("503") ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("timed out")
  ) {
    return {
      title: "Service temporarily busy",
      message: "ShopEase Care is experiencing high demand. Please retry in a few seconds.",
    };
  }

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
    return {
      title: "Connection issue",
      message: "Could not reach ShopEase servers. Check your internet connection and retry.",
    };
  }

  // Unwrap nested JSON error strings if an upstream API forwarded raw JSON
  if (text.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
      const inner =
        typeof parsed?.error === "string"
          ? parsed.error
          : parsed?.error?.message ?? parsed?.message;
      if (inner) return toSmartAppError(inner, status);
    } catch {
      // Fall through to generic clean message
    }
    return {
      title: "Request could not be completed",
      message: "Something went wrong while processing your request. Please try again.",
    };
  }

  return {
    title: "Action could not be completed",
    message: text.trim() || "Something went wrong. Please try again.",
  };
}

/**
 * Safely reads an API response without crashing on HTML error pages.
 */
export async function readSafeJson<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw.trim()) {
    if (!res.ok) throw new Error(toSmartAppError("", res.status).message);
    return {} as T;
  }
  try {
    const parsed = JSON.parse(raw) as T & { error?: unknown };
    if (!res.ok) {
      const smart = toSmartAppError(
        typeof parsed?.error === "string" ? parsed.error : JSON.stringify(parsed?.error ?? raw),
        res.status
      );
      throw new Error(smart.message);
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(toSmartAppError(raw, res.status).message);
    }
    throw err;
  }
}

export function useAppNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, title: string, message: string) => {
      const id = nextId.current++;
      setNotifications((prev) => [...prev.slice(-2), { id, tone, title, message }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  return { notifications, notify, dismiss };
}

export function AppToastContainer({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: number) => void;
}) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96"
    >
      {notifications.map((n) => {
        const toneClasses =
          n.tone === "error"
            ? isDark
              ? "border-red-500/40 bg-slate-900/95 text-red-200"
              : "border-red-200 bg-white/95 text-red-900"
            : n.tone === "warning"
              ? isDark
                ? "border-amber-500/40 bg-slate-900/95 text-amber-200"
                : "border-amber-200 bg-white/95 text-amber-900"
              : n.tone === "success"
                ? isDark
                  ? "border-emerald-500/40 bg-slate-900/95 text-emerald-200"
                  : "border-emerald-200 bg-white/95 text-emerald-900"
                : isDark
                  ? "border-indigo-500/40 bg-slate-900/95 text-indigo-200"
                  : "border-indigo-200 bg-white/95 text-slate-900";

        const badgeColor =
          n.tone === "error"
            ? "bg-red-500"
            : n.tone === "warning"
              ? "bg-amber-500"
              : n.tone === "success"
                ? "bg-emerald-500"
                : "bg-indigo-500";

        return (
          <div
            key={n.id}
            role="status"
            className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border p-3 shadow-lg backdrop-blur ${toneClasses}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${badgeColor}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{n.title}</p>
              <p className={isDark ? "mt-0.5 text-xs text-slate-300" : "mt-0.5 text-xs text-slate-600"}>
                {n.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(n.id)}
              aria-label="Dismiss notification"
              className={
                isDark
                  ? "min-h-[28px] min-w-[28px] rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "min-h-[28px] min-w-[28px] rounded-md text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

