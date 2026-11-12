"use client";

import { useRef, useState } from "react";
import AgentChat, { type QueuedPrompt } from "@/components/AgentChat";
import { AppToastContainer, useAppNotifications } from "@/components/AppToast";
import NavBar from "@/components/NavBar";
import OrdersList from "@/components/OrdersList";
import ReturnsList from "@/components/ReturnsList";
import { ThemeProvider } from "@/components/ThemeProvider";

/*
 * HOME PAGE
 * Full-width single-screen 3-column workspace on desktop (Chat · My Orders · My Returns)
 * with no main page scrollbar and generous independent sub-scrollers.
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the lists reload.
  const [refreshKey, setRefreshKey] = useState(0);
  const [queuedPrompt, setQueuedPrompt] = useState<QueuedPrompt | null>(null);
  const [chatHighlighted, setChatHighlighted] = useState(false);
  const nextPromptId = useRef(1);
  const chatSectionRef = useRef<HTMLElement>(null);
  const { notifications, notify, dismiss } = useAppNotifications();

  function focusChat() {
    setChatHighlighted(true);
    setTimeout(() => setChatHighlighted(false), 1200);
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function askAgent(text: string) {
    const id = nextPromptId.current++;
    setQueuedPrompt({ id, text });
    focusChat();
  }

  return (
    <ThemeProvider>
      <AppToastContainer notifications={notifications} onDismiss={dismiss} />
      <main className="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-5 sm:py-4 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden lg:px-6 lg:py-4">
        <div className="shrink-0">
          <NavBar />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
          <section
            ref={chatSectionRef}
            className="min-w-0 md:col-span-2 lg:col-span-5 lg:flex lg:min-h-0 lg:flex-col"
          >
            <AgentChat
              queuedPrompt={queuedPrompt}
              highlighted={chatHighlighted}
              onNotify={notify}
              onDataChanged={() => setRefreshKey((k) => k + 1)}
            />
          </section>
          <section className="min-w-0 lg:col-span-4 lg:flex lg:min-h-0 lg:flex-col">
            <OrdersList
              refreshKey={refreshKey}
              onAskAgent={askAgent}
              onNotify={notify}
              embedded
            />
          </section>
          <section className="min-w-0 lg:col-span-3 lg:flex lg:min-h-0 lg:flex-col">
            <ReturnsList refreshKey={refreshKey} onNotify={notify} embedded />
          </section>
        </div>

        {/* Hard-push Back to Chat arrow button on mobile/tablet */}
        <button
          type="button"
          onClick={focusChat}
          aria-label="Back to support chat"
          className="fixed bottom-4 right-4 z-40 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition active:scale-95 hover:bg-indigo-500 lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4">
            <path
              d="M8 13V3.5M8 3.5L3.5 8M8 3.5L12.5 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back to chat</span>
        </button>
      </main>
    </ThemeProvider>
  );
}
