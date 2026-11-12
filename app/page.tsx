"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import OrdersList from "@/components/OrdersList";

/*
 * HOME PAGE
 * Left: the agent chat. Right: the data the agent works on (here: orders).
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the list on the right reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold sm:text-xl">ShopEase · Customer support agent</h1>
          <p className="text-sm text-slate-500">Logged in as Priya Raman (C001)</p>
        </div>
        <button
          onClick={logout}
          className="min-h-[44px] shrink-0 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          Log out
        </button>
      </header>
      <div className="grid gap-4 md:grid-cols-5">
        <section className="min-w-0 md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="min-w-0 md:col-span-2">
          <OrdersList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
