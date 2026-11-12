"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import NavBar from "@/components/NavBar";
import OrdersList from "@/components/OrdersList";

/*
 * HOME PAGE
 * Left: the agent chat. Right: the data the agent works on (here: orders).
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the list on the right reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      <NavBar />
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
