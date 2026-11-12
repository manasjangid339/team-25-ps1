"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import NavBar from "@/components/NavBar";
import OrdersList from "@/components/OrdersList";
import ReturnsList from "@/components/ReturnsList";

/*
 * HOME PAGE
 * Left: the agent chat. Right: live orders and returns.
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the lists on the right reload.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      <NavBar />
      <div className="grid gap-4 md:grid-cols-5">
        <section className="min-w-0 md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="min-w-0 space-y-4 md:col-span-2">
          <OrdersList refreshKey={refreshKey} />
          <ReturnsList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
