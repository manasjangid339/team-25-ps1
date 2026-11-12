"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readSafeJson, toSmartAppError, type ToastTone } from "./AppToast";
import { useTheme } from "./ThemeProvider";

type ProductRef = { name: string };

type ReturnRow = {
  id: number;
  order_id: number;
  product_id: string;
  reason: string;
  status: string;
  created_at: string;
  products: ProductRef | ProductRef[] | null;
};

const LIGHT_BADGES: Record<string, string> = {
  requested: "bg-amber-50 text-amber-800",
  approved: "bg-blue-50 text-blue-700",
  picked_up: "bg-indigo-50 text-indigo-700",
  refunded: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const DARK_BADGES: Record<string, string> = {
  requested: "bg-amber-500/20 text-amber-300",
  approved: "bg-blue-500/20 text-blue-300",
  picked_up: "bg-indigo-500/20 text-indigo-300",
  refunded: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-red-500/20 text-red-300",
};

const FILTER_STATUSES = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "picked_up", label: "Picked up" },
  { value: "refunded", label: "Refunded" },
  { value: "rejected", label: "Rejected" },
];

const RETURN_STEPS = ["requested", "approved", "picked_up", "refunded"] as const;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

/**
 * Live card list of the logged-in customer's returns from GET /api/returns.
 * Supports search, status filtering, and return progress tracking.
 */
export default function ReturnsList({
  refreshKey,
  compactLimit,
  embedded = false,
  onNotify,
}: {
  refreshKey: number;
  compactLimit?: number;
  embedded?: boolean;
  onNotify?: (tone: ToastTone, title: string, message: string) => void;
}) {
  const { isDark } = useTheme();
  const [returnsList, setReturnsList] = useState<ReturnRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const loadReturns = useCallback(async () => {
    try {
      const res = await fetch("/api/returns", { cache: "no-store" });
      const data = await readSafeJson<{ returns?: ReturnRow[] }>(res);
      setReturnsList(Array.isArray(data.returns) ? data.returns : []);
      setError("");
    } catch (err) {
      const smart = toSmartAppError(err);
      setError(smart.message);
      onNotify?.("error", smart.title, smart.message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadReturns();
    const timer = setInterval(loadReturns, 5000);
    return () => clearInterval(timer);
  }, [loadReturns, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return returnsList.filter((ret) => {
      if (statusFilter !== "all" && ret.status !== statusFilter) return false;
      if (!q) return true;
      const productName = unwrapOne(ret.products)?.name ?? ret.product_id;
      const haystack = `${ret.id} ${ret.order_id} ${productName} ${ret.reason}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [returnsList, statusFilter, search]);

  return (
    <div
      className={
        isDark
          ? `overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/95 shadow-md ${
              embedded ? "flex flex-col lg:h-full lg:min-h-0" : ""
            }`
          : `overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
              embedded ? "flex flex-col lg:h-full lg:min-h-0" : ""
            }`
      }
    >
      <div
        className={
          isDark
            ? "shrink-0 space-y-2 border-b border-slate-800 px-3.5 py-2.5"
            : "shrink-0 space-y-2 border-b border-slate-200 px-3.5 py-2.5"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">My Returns</h2>
            <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              Live from Supabase · updates when a return is requested
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadReturns()}
            className={
              isDark
                ? "min-h-[36px] rounded-lg border border-slate-700 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                : "min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            }
          >
            Refresh
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search return #, order #, product, or reason..."
          className={
            isDark
              ? "min-h-[40px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400"
              : "min-h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
          }
        />

        <div className={embedded ? "flex items-center gap-1.5 overflow-x-auto pb-0.5" : "flex flex-wrap gap-1.5"}>
          {FILTER_STATUSES.map((opt) => {
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
      </div>

      <div className={embedded ? "min-h-0 flex-1 space-y-3 overflow-y-auto p-3 max-h-[460px] lg:max-h-none" : "space-y-3 p-3"}>
        {loading && !error && (
          <p className={isDark ? "px-1 py-2 text-sm text-slate-400" : "px-1 py-2 text-sm text-slate-500"}>
            Loading returns...
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
          <p className={isDark ? "px-1 py-2 text-sm text-slate-400" : "px-1 py-2 text-sm text-slate-500"}>
            {returnsList.length === 0 ? "No return requests yet." : "No returns match the current filter."}
          </p>
        )}

        {filtered.slice(0, compactLimit && !showAll && !search.trim() && statusFilter === "all" ? compactLimit : filtered.length).map((ret) => {
          const product = unwrapOne(ret.products);
          const productName = product?.name ?? ret.product_id;
          const badgeMap = isDark ? DARK_BADGES : LIGHT_BADGES;
          const badgeStyle = badgeMap[ret.status] ?? (isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700");
          const statusLabel = ret.status.replaceAll("_", " ");
          const stepIdx = RETURN_STEPS.indexOf(ret.status as (typeof RETURN_STEPS)[number]);

          return (
            <article
              key={ret.id}
              className={
                isDark
                  ? "min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"
                  : "min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">Return #{ret.id}</span>
                  <span className={isDark ? "ml-2 text-xs text-slate-400" : "ml-2 text-xs text-slate-500"}>
                    Order #{ret.order_id}
                  </span>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
                  {statusLabel}
                </span>
              </div>

              {stepIdx >= 0 && (
                <div className="mt-2.5 grid grid-cols-4 gap-1" aria-label={`Return ${ret.id} progress`}>
                  {RETURN_STEPS.map((step, idx) => (
                    <div key={step} className="space-y-1">
                      <div
                        className={
                          idx <= stepIdx
                            ? isDark
                              ? "h-1.5 rounded-full bg-emerald-400"
                              : "h-1.5 rounded-full bg-emerald-600"
                            : isDark
                              ? "h-1.5 rounded-full bg-slate-800"
                              : "h-1.5 rounded-full bg-slate-200"
                        }
                      />
                      <p
                        className={
                          idx <= stepIdx
                            ? isDark
                              ? "truncate text-[10px] font-medium capitalize text-slate-200"
                              : "truncate text-[10px] font-medium capitalize text-slate-700"
                            : isDark
                              ? "truncate text-[10px] capitalize text-slate-600"
                              : "truncate text-[10px] capitalize text-slate-400"
                        }
                      >
                        {step.replaceAll("_", " ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className={isDark ? "mt-2 break-words font-medium text-slate-100" : "mt-2 break-words font-medium text-slate-800"}>
                {productName}
              </p>
              <p className={isDark ? "mt-1 break-words text-xs text-slate-300" : "mt-1 break-words text-xs text-slate-600"}>
                Reason: {ret.reason}
              </p>
              <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                Requested: {formatDate(ret.created_at)}
              </p>
            </article>
          );
        })}

        {compactLimit && !search.trim() && statusFilter === "all" && filtered.length > compactLimit && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className={
              isDark
                ? "min-h-[40px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-medium text-indigo-300 hover:bg-slate-800"
                : "min-h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
            }
          >
            {showAll ? `Show top ${compactLimit}` : `Show all ${filtered.length} returns`}
          </button>
        )}
      </div>
    </div>
  );
}
