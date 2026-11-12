"use client";

import { useEffect, useState } from "react";

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

const STATUS_BADGE_CLASSES: Record<string, string> = {
  requested: "bg-amber-50 text-amber-800",
  approved: "bg-blue-50 text-blue-700",
  picked_up: "bg-indigo-50 text-indigo-700",
  refunded: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

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
 * Refreshes whenever refreshKey increments and on a 5-second interval.
 */
export default function ReturnsList({ refreshKey }: { refreshKey: number }) {
  const [returnsList, setReturnsList] = useState<ReturnRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReturns() {
      try {
        const res = await fetch("/api/returns", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load returns");
        if (!active) return;
        setReturnsList(Array.isArray(data.returns) ? data.returns : []);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load returns");
      }
    }

    loadReturns();
    const timer = setInterval(loadReturns, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">My Returns</h2>
        <p className="text-xs text-slate-500">Live from Supabase. Updates when a return is requested.</p>
      </div>

      <div className="space-y-3 p-3">
        {error && <p className="px-1 py-2 text-sm text-red-600">{error}</p>}
        {!error && returnsList.length === 0 && (
          <p className="px-1 py-2 text-sm text-slate-500">No return requests yet.</p>
        )}

        {returnsList.map((ret) => {
          const product = unwrapOne(ret.products);
          const productName = product?.name ?? ret.product_id;
          const badgeStyle = STATUS_BADGE_CLASSES[ret.status] ?? "bg-slate-100 text-slate-700";
          const statusLabel = ret.status.replaceAll("_", " ");

          return (
            <article key={ret.id} className="min-w-0 rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">Return #{ret.id}</span>
                  <span className="ml-2 text-xs text-slate-500">Order #{ret.order_id}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="mt-2 break-words font-medium text-slate-800">{productName}</p>
              <p className="mt-1 break-words text-xs text-slate-600">Reason: {ret.reason}</p>
              <p className="mt-1 text-xs text-slate-500">Requested: {formatDate(ret.created_at)}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
