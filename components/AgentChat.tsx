"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

// Sample prompts matching the PS1 ShopEase problem statement.
const SAMPLE_PROMPTS = [
  "Where is my order 1003?",
  "I want to return the shoes from my last order, they are too small.",
  "My order is 4 days late and nobody is answering.",
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the last 20 messages are sent, to keep requests small.
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const result = data as AgentResult;
      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);
      if (result.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[68dvh] min-h-[380px] flex-col rounded-xl border border-slate-200 bg-white md:h-[70vh]">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Agent</h2>
        <p className="text-xs text-slate-500">Ask in plain English. You can see every tool the agent uses.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Try one of these:</p>
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="block min-h-[44px] w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "min-w-0 max-w-[85%] break-words rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white"
                  : "min-w-0 max-w-[85%] space-y-2"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.role === "model" ? (
                <div className="whitespace-pre-wrap break-words rounded-2xl bg-slate-100 px-3 py-2 text-sm">{m.text}</div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && <p className="text-sm text-slate-500">Agent is working...</p>}
        {error && <p className="break-words text-sm text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your request..."
          className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-slate-500 sm:text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-[44px] shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Shows each tool call so users (and judges) can see what the agent did. */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <details key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
          <summary className="cursor-pointer select-none py-2 leading-5 break-words">
            <span className={s.ok ? "text-emerald-700" : "text-red-600"}>{s.ok ? "Done" : "Failed"}</span>
            {" · "}
            <span className="font-mono font-medium">{s.tool}</span>
            {s.writes && (
              <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">writes data</span>
            )}
          </summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all pb-1 text-slate-600">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
