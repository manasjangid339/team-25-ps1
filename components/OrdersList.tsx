"use client";

import { useEffect, useState } from "react";

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

const STATUS_BADGE_CLASSES: Record<string, string> = {
  placed: "bg-slate-100 text-slate-700",
  shipped: "bg-blue-50 text-blue-700",
  out_for_delivery: "bg-amber-50 text-amber-800",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

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

/**
 * Live card list of the logged-in customer's orders from GET /api/orders.
 * Refreshes whenever refreshKey increments and on a 5-second interval.
 */
export default function OrdersList({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load orders");
        if (!active) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load orders");
      }
    }

    loadOrders();
    const timer = setInterval(loadOrders, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">My Orders</h2>
        <p className="text-xs text-slate-500">Live from Supabase. Updates when the agent changes data.</p>
      </div>

      <div className="space-y-3 p-3">
        {error && <p className="px-1 py-2 text-sm text-red-600">{error}</p>}
        {!error && orders.length === 0 && <p className="px-1 py-2 text-sm text-slate-500">No orders found.</p>}

        {orders.map((order) => {
          const items = normalizeItems(order.order_items);
          const badgeStyle = STATUS_BADGE_CLASSES[order.status] ?? "bg-slate-100 text-slate-700";
          const statusLabel = order.status.replaceAll("_", " ");
          const dateLabel =
            order.status === "delivered" || order.delivered_date
              ? `Delivered: ${order.delivered_date ?? "—"}`
              : `Expected: ${order.expected_delivery ?? "—"}`;

          return (
            <article key={order.id} className="min-w-0 rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">Order #{order.id}</span>
                  <span className="ml-2 text-xs text-slate-500">{order.order_date}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="font-medium text-slate-800">Total: {formatRupees(order.total_amount)}</span>
                <span>{dateLabel}</span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                <span>Courier: {order.courier ?? "Pending"}</span>
                {order.tracking_number && <span className="break-all">Tracking: {order.tracking_number}</span>}
              </div>

              {items.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700">
                  {items.map((item) => {
                    const product = unwrapOne(item.products);
                    const productName = product?.name ?? item.product_id;
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-2">
                        <span className="min-w-0 break-words">{productName}</span>
                        <span className="shrink-0 text-slate-500">× {item.quantity}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
