"use client";

import { useCallback, useEffect, useState } from "react";

type TicketStatus = "open" | "in_progress" | "resolved";

type TicketRow = {
  id: number;
  order_id: number | null;
  issue: string;
  priority: string;
  status: TicketStatus;
  created_at: string;
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  open: "bg-amber-50 text-amber-800",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

/**
 * Support ticket management board backed by GET/PATCH /api/tickets.
 */
export default function TicketsBoard() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load tickets");
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
    }
  }, []);

  useEffect(() => {
    loadTickets();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Support Tickets</h2>
        <p className="text-xs text-slate-500">Escalated issues from customer chat. Update status below.</p>
      </div>

      <div className="space-y-3 p-3">
        {error && <p className="px-1 py-2 text-sm text-red-600">{error}</p>}
        {!error && tickets.length === 0 && (
          <p className="px-1 py-2 text-sm text-slate-500">No support tickets yet.</p>
        )}

        {tickets.map((t) => {
          const priorityStyle = PRIORITY_BADGE_CLASSES[t.priority] ?? "bg-slate-100 text-slate-700";
          const statusStyle = STATUS_BADGE_CLASSES[t.status] ?? "bg-slate-100 text-slate-700";
          const createdDate = t.created_at ? t.created_at.slice(0, 10) : "—";

          return (
            <article key={t.id} className="min-w-0 rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">Ticket #{t.id}</span>
                  <span className="ml-2 text-xs text-slate-500">
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

              <p className="mt-2 break-words text-slate-800">{t.issue}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-500">Created: {createdDate}</span>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Status</span>
                  <select
                    aria-label={`Status for ticket ${t.id}`}
                    value={t.status}
                    disabled={updatingId === t.id}
                    onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)}
                    className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:opacity-50"
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
