"use client";

import { useRef, useState } from "react";
import AgentChat, { type QueuedPrompt } from "@/components/AgentChat";
import NavBar from "@/components/NavBar";
import OrdersList from "@/components/OrdersList";
import ReturnsList from "@/components/ReturnsList";
import { ThemeProvider } from "@/components/ThemeProvider";

/*
 * HOME PAGE
 * Left: the live support agent chat. Right: compact orders and returns with 1-tap actions.
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the lists on the right reload.
  const [refreshKey, setRefreshKey] = useState(0);
  const [queuedPrompt, setQueuedPrompt] = useState<QueuedPrompt | null>(null);
  const nextPromptId = useRef(1);
  const chatSectionRef = useRef<HTMLElement>(null);

  function askAgent(text: string) {
    const id = nextPromptId.current++;
    setQueuedPrompt({ id, text });
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <ThemeProvider>
      <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
        <NavBar />
        <div className="grid gap-4 md:grid-cols-5">
          <section ref={chatSectionRef} className="min-w-0 md:col-span-3">
            <AgentChat
              queuedPrompt={queuedPrompt}
              onDataChanged={() => setRefreshKey((k) => k + 1)}
            />
          </section>
          <section className="min-w-0 space-y-4 md:col-span-2">
            <OrdersList refreshKey={refreshKey} onAskAgent={askAgent} compactLimit={3} />
            <ReturnsList refreshKey={refreshKey} compactLimit={3} />
          </section>
        </div>
      </main>
    </ThemeProvider>
  );
}
