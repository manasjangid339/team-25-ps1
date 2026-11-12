"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "./ThemeProvider";

type TicketStatus = "open" | "in_progress" | "resolved";

type TicketRow = {
  id: number;
  order_id: number | null;
  issue: string;
  priority: string;
  status: TicketStatus;
  created_at: string;
};

const LIGHT_PRIORITY_BADGES: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const DARK_PRIORITY_BADGES: Record<string, string> = {
  high: "bg-red-500/20 text-red-300",
  medium: "bg-amber-500/20 text-amber-300",
  low: "bg-slate-800 text-slate-200",
};

const LIGHT_STATUS_BADGES: Record<string, string> = {
  open: "bg-amber-50 text-amber-800",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

const DARK_STATUS_BADGES: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  resolved: "bg-emerald-500/20 text-emerald-300",
};

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

/**
 * Support ticket management board backed by GET/PATCH /api/tickets.
 * Includes theme adaptation, status & priority filters, and live updates.
 */
export default function TicketsBoard() {
  const { isDark } = useTheme();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load tickets");
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
    const timer = setInterval(loadTickets, 5000);
    return () => clearInterval(timer);
  }, [loadTickets]);

  async function updateStatus(id: number, status: TicketStatus) {
    setUpdatingId(id);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update ticket");
      await loadTickets();
      setSavedId(id);
      setTimeout(() => setSavedId((curr) => (curr === id ? null : curr)), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket");
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        String(t.id).includes(q) ||
        String(t.order_id ?? "").toLowerCase().includes(q) ||
        t.issue.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, priorityFilter, search]);

  return (
    <div
      className={
        isDark
          ? "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm"
          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      }
    >
      <div
        className={
          isDark
            ? "space-y-3 border-b border-slate-800 px-4 py-3"
            : "space-y-3 border-b border-slate-200 px-4 py-3"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Support Tickets</h2>
            <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              Escalated issues from customer chat · update status via PATCH /api/tickets
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadTickets()}
            className={
              isDark
                ? "min-h-[36px] rounded-lg border border-slate-700 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                : "min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            }
          >
            Refresh
          </button>
        </div>

        {!error && tickets.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TicketStat label="Total" value={counts.total} isDark={isDark} />
            <TicketStat label="Open" value={counts.open} isDark={isDark} />
            <TicketStat label="In progress" value={counts.inProgress} isDark={isDark} />
            <TicketStat label="Resolved" value={counts.resolved} isDark={isDark} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[{ value: "all", label: "All statuses" }, ...STATUS_OPTIONS].map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={
                    active
                      ? isDark
                        ? "min-h-[34px] rounded-full bg-indigo-500 px-2.5 py-1 text-xs font-medium text-white"
                        : "min-h-[34px] rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white"
                      : isDark
                        ? "min-h-[34px] rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
                        : "min-h-[34px] rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, order, or issue..."
              aria-label="Search tickets"
              className={
                isDark
                  ? "min-h-[38px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400 sm:w-52"
                  : "min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 sm:w-52"
              }
            />
            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={
                isDark
                  ? "min-h-[38px] rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-100 outline-none focus:border-indigo-400"
                  : "min-h-[38px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
              }
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {loading && !error && (
          <p className={isDark ? "px-1 py-2 text-sm text-slate-400" : "px-1 py-2 text-sm text-slate-500"}>
            Loading tickets...
          </p>
        )}
        {error && (
          <p
            className={
              isDark
                ? "rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                : "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            }
          >
            {error}
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div
            className={
              isDark
                ? "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-400"
                : "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500"
            }
          >
            <span>
              {tickets.length === 0
                ? "No support tickets yet. Escalate an issue in Support chat when needed."
                : "No tickets match the current filter."}
            </span>
            {tickets.length === 0 && (
              <Link
                href="/"
                className={
                  isDark
                    ? "inline-flex min-h-[36px] items-center rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
                    : "inline-flex min-h-[36px] items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                }
              >
                Start support chat
              </Link>
            )}
          </div>
        )}

        {filtered.map((t) => {
          const priorityMap = isDark ? DARK_PRIORITY_BADGES : LIGHT_PRIORITY_BADGES;
          const statusMap = isDark ? DARK_STATUS_BADGES : LIGHT_STATUS_BADGES;
          const priorityStyle = priorityMap[t.priority] ?? (isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700");
          const statusStyle = statusMap[t.status] ?? (isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700");
          const createdDate = t.created_at ? t.created_at.slice(0, 10) : "—";

          return (
            <article
              key={t.id}
              className={
                isDark
                  ? "min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"
                  : "min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">Ticket #{t.id}</span>
                  <span className={isDark ? "ml-2 text-xs text-slate-400" : "ml-2 text-xs text-slate-500"}>
                    {t.order_id ? `Order #${t.order_id}` : "General"}
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${priorityStyle}`}>
                    {t.priority} priority
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
                    {t.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <p className={isDark ? "mt-2 break-words text-slate-100" : "mt-2 break-words text-slate-800"}>
                {t.issue}
              </p>

              <div
                className={
                  isDark
                    ? "mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5"
                    : "mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5"
                }
              >
                <span className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                  Created: {createdDate}
                </span>
                <label className={isDark ? "flex items-center gap-2 text-xs text-slate-300" : "flex items-center gap-2 text-xs text-slate-600"}>
                  <span>{savedId === t.id ? "Saved" : "Status"}</span>
                  <select
                    aria-label={`Status for ticket ${t.id}`}
                    value={t.status}
                    disabled={updatingId === t.id}
                    onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)}
                    className={
                      isDark
                        ? "min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:opacity-50"
                        : "min-h-[44px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:opacity-50"
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TicketStat({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1.5"
          : "rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5"
      }
    >
      <p className={isDark ? "text-[11px] text-slate-400" : "text-[11px] text-slate-500"}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
