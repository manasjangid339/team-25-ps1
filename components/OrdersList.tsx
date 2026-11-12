"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readSafeJson, toSmartAppError, type ToastTone } from "./AppToast";
import { useTheme } from "./ThemeProvider";

type ProductRef = { name: string };

type OrderItem = {
  id: number;
  product_id: string;
  quantity: number;
  unit_price: number;
  products: ProductRef | ProductRef[] | null;
};

type Order = {
  id: number;
  order_date: string;
  status: string;
  expected_delivery: string | null;
  delivered_date: string | null;
  total_amount: number | string;
  courier: string | null;
  tracking_number: string | null;
  order_items?: OrderItem[] | OrderItem | null;
};

const LIGHT_BADGES: Record<string, string> = {
  placed: "bg-slate-100 text-slate-700",
  shipped: "bg-blue-50 text-blue-700",
  out_for_delivery: "bg-amber-50 text-amber-800",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

const DARK_BADGES: Record<string, string> = {
  placed: "bg-slate-800 text-slate-200",
  shipped: "bg-blue-500/20 text-blue-300",
  out_for_delivery: "bg-amber-500/20 text-amber-300",
  delivered: "bg-emerald-500/20 text-emerald-300",
  cancelled: "bg-red-500/20 text-red-300",
};

const FILTER_STATUSES = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const DELIVERY_STEPS = ["placed", "shipped", "out_for_delivery", "delivered"] as const;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeItems(items: Order["order_items"]): OrderItem[] {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function formatRupees(amount: number | string): string {
  const num = Number(amount);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : `₹${amount}`;
}

function todayIsoLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isOrderDelayed(order: Order, today: string): boolean {
  if (order.status === "delivered" || order.status === "cancelled") return false;
  return Boolean(order.expected_delivery && today > order.expected_delivery);
}

/**
 * Live card list of the logged-in customer's orders from GET /api/orders.
 * Supports search, status filtering, delivery progress stepper, tracking copy,
 * and optional one-tap agent prompts.
 */
export default function OrdersList({
  refreshKey,
  onAskAgent,
  compactLimit,
  embedded = false,
  onNotify,
}: {
  refreshKey: number;
  onAskAgent?: (prompt: string) => void;
  compactLimit?: number;
  embedded?: boolean;
  onNotify?: (tone: ToastTone, title: string, message: string) => void;
}) {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await readSafeJson<{ orders?: Order[] }>(res);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
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
    void loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);
  }, [loadOrders, refreshKey]);

  const today = todayIsoLocal();

  const stats = useMemo(() => {
    const delayed = orders.filter((o) => isOrderDelayed(o, today)).length;
    const inTransit = orders.filter(
      (o) => o.status === "placed" || o.status === "shipped" || o.status === "out_for_delivery"
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    return { total: orders.length, inTransit, delayed, delivered };
  }, [orders, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      const items = normalizeItems(order.order_items);
      const productNames = items.map((it) => unwrapOne(it.products)?.name ?? it.product_id).join(" ");
      const haystack = `${order.id} ${order.courier ?? ""} ${order.tracking_number ?? ""} ${productNames}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, statusFilter, search]);

  async function copyTracking(orderId: number, tracking: string) {
    try {
      await navigator.clipboard.writeText(tracking);
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId((curr) => (curr === orderId ? null : curr)), 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  return (
    <div
      className={
        isDark
          ? `overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm ${
              embedded ? "flex flex-col md:h-full md:min-h-0" : ""
            }`
          : `overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
              embedded ? "flex flex-col md:h-full md:min-h-0" : ""
            }`
      }
    >
      <div
        className={
          isDark
            ? "shrink-0 space-y-2.5 border-b border-slate-800 px-4 py-3"
            : "shrink-0 space-y-2.5 border-b border-slate-200 px-4 py-3"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">My Orders</h2>
            <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              Live from Supabase · auto-refreshes every 5s
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className={
              isDark
                ? "min-h-[36px] rounded-lg border border-slate-700 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                : "min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            }
          >
            Refresh
          </button>
        </div>

        {!error && orders.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Total" value={stats.total} isDark={isDark} />
            <StatChip label="Active" value={stats.inTransit} isDark={isDark} tone="blue" />
            <StatChip label="Delivered" value={stats.delivered} isDark={isDark} tone="green" />
            <StatChip label="Delayed" value={stats.delayed} isDark={isDark} tone={stats.delayed > 0 ? "amber" : "neutral"} />
          </div>
        )}

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, product, courier, or tracking..."
          className={
            isDark
              ? "min-h-[40px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400"
              : "min-h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
          }
        />

        <div className="flex flex-wrap gap-1.5">
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

      <div className={embedded ? "min-h-0 flex-1 space-y-3 overflow-y-auto p-3 max-h-[420px] md:max-h-none" : "space-y-3 p-3"}>
        {loading && !error && (
          <p className={isDark ? "px-1 py-2 text-sm text-slate-400" : "px-1 py-2 text-sm text-slate-500"}>
            Loading orders...
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
            No orders match the current filter.
          </p>
        )}

        {filtered.slice(0, compactLimit && !showAll && !search.trim() && statusFilter === "all" ? compactLimit : filtered.length).map((order) => {
          const items = normalizeItems(order.order_items);
          const badgeMap = isDark ? DARK_BADGES : LIGHT_BADGES;
          const badgeStyle = badgeMap[order.status] ?? (isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700");
          const statusLabel = order.status.replaceAll("_", " ");
          const delayed = isOrderDelayed(order, today);
          const dateLabel =
            order.status === "delivered" || order.delivered_date
              ? `Delivered: ${order.delivered_date ?? "—"}`
              : `Expected: ${order.expected_delivery ?? "—"}`;
          const stepIdx = DELIVERY_STEPS.indexOf(order.status as (typeof DELIVERY_STEPS)[number]);
          const firstProductName = items[0] ? (unwrapOne(items[0].products)?.name ?? items[0].product_id) : "item";

          return (
            <article
              key={order.id}
              className={
                isDark
                  ? "min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"
                  : "min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">Order #{order.id}</span>
                  <span className={isDark ? "ml-2 text-xs text-slate-400" : "ml-2 text-xs text-slate-500"}>
                    {order.order_date}
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {delayed && (
                    <span
                      className={
                        isDark
                          ? "rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-300"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
                      }
                    >
                      Delayed
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>

              {stepIdx >= 0 && (
                <div className="mt-2.5 grid grid-cols-4 gap-1" aria-label={`Order ${order.id} progress`}>
                  {DELIVERY_STEPS.map((step, idx) => (
                    <div key={step} className="space-y-1">
                      <div
                        className={
                          idx <= stepIdx
                            ? isDark
                              ? "h-1.5 rounded-full bg-indigo-400"
                              : "h-1.5 rounded-full bg-slate-900"
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

              <div
                className={
                  isDark
                    ? "mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-300"
                    : "mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-600"
                }
              >
                <span className={isDark ? "font-semibold text-slate-100" : "font-semibold text-slate-900"}>
                  Total: {formatRupees(order.total_amount)}
                </span>
                <span className={delayed ? (isDark ? "font-medium text-red-300" : "font-medium text-red-600") : ""}>
                  {dateLabel}
                </span>
              </div>

              <div
                className={
                  isDark
                    ? "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400"
                    : "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"
                }
              >
                <span>Courier: {order.courier ?? "Pending"}</span>
                {order.tracking_number && (
                  <span className="inline-flex flex-wrap items-center gap-1.5 break-all">
                    <span>Tracking: {order.tracking_number}</span>
                    <button
                      type="button"
                      onClick={() => copyTracking(order.id, order.tracking_number!)}
                      className={
                        isDark
                          ? "rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700"
                          : "rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200"
                      }
                    >
                      {copiedOrderId === order.id ? "Copied" : "Copy"}
                    </button>
                  </span>
                )}
              </div>

              {items.length > 0 && (
                <ul
                  className={
                    isDark
                      ? "mt-2 space-y-1 border-t border-slate-800 pt-2 text-xs text-slate-300"
                      : "mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700"
                  }
                >
                  {items.map((item) => {
                    const product = unwrapOne(item.products);
                    const productName = product?.name ?? item.product_id;
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-2">
                        <span className="min-w-0 break-words">{productName}</span>
                        <span className={isDark ? "shrink-0 text-slate-400" : "shrink-0 text-slate-500"}>
                          × {item.quantity}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {onAskAgent && (
                <div
                  className={
                    isDark
                      ? "mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-800 pt-2"
                      : "mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2"
                  }
                >
                  <QuickActionBtn
                    isDark={isDark}
                    label="Check details"
                    onClick={() => onAskAgent(`Where is my order ${order.id}?`)}
                  />
                  {order.status === "placed" && (
                    <QuickActionBtn
                      isDark={isDark}
                      label="Cancel order"
                      onClick={() => onAskAgent(`Cancel order ${order.id}`)}
                    />
                  )}
                  {order.status === "delivered" && (
                    <QuickActionBtn
                      isDark={isDark}
                      label="Return item"
                      onClick={() => onAskAgent(`Can I return ${firstProductName} from order ${order.id}?`)}
                    />
                  )}
                  {delayed && (
                    <QuickActionBtn
                      isDark={isDark}
                      label="Escalate delay"
                      onClick={() =>
                        onAskAgent(`My order ${order.id} is late and I need help from support.`)
                      }
                    />
                  )}
                </div>
              )}
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
            {showAll ? `Show top ${compactLimit}` : `Show all ${filtered.length} orders`}
          </button>
        )}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  isDark,
  tone = "neutral",
}: {
  label: string;
  value: number;
  isDark: boolean;
  tone?: "neutral" | "blue" | "green" | "amber";
}) {
  const valueColor =
    tone === "blue"
      ? isDark
        ? "text-blue-300"
        : "text-blue-700"
      : tone === "green"
        ? isDark
          ? "text-emerald-300"
          : "text-emerald-700"
        : tone === "amber"
          ? isDark
            ? "text-amber-300"
            : "text-amber-700"
          : isDark
            ? "text-slate-100"
            : "text-slate-900";

  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1.5"
          : "rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5"
      }
    >
      <p className={isDark ? "text-[11px] text-slate-400" : "text-[11px] text-slate-500"}>{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

function QuickActionBtn({
  label,
  onClick,
  isDark,
}: {
  label: string;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isDark
          ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-indigo-300 transition active:scale-[0.97] hover:border-indigo-500/60 hover:bg-slate-800"
          : "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition active:scale-[0.97] hover:border-indigo-300 hover:bg-indigo-50"
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        className="h-3.5 w-3.5 shrink-0"
      >
        <path
          d="M9.5 3.5L5 8l4.5 4.5M5.5 8H13"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
