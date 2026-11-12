"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";
import { readSafeJson, toSmartAppError, type ToastTone } from "./AppToast";
import { useTheme } from "./ThemeProvider";

type Message = {
  id: number;
  role: "user" | "model";
  text: string;
  time: string;
  steps?: AgentStep[];
};

type FeedbackValue = "up" | "down";

export type QueuedPrompt = { id: number; text: string };

const SAMPLE_PROMPTS = [
  "Where is my order 1003?",
  "I want to return the shoes from my last order, they are too small.",
  "My order is 4 days late and nobody is answering.",
  "Show all my recent orders.",
  "Cancel order 1012 since it has not shipped yet.",
  "Can I return the items from order 1025?",
];

const FOLLOW_UP_CHIPS = [
  "Show my recent orders",
  "Check my return status",
  "Connect me with a human agent",
];

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgentChat({
  onDataChanged,
  queuedPrompt,
  onNotify,
  highlighted = false,
}: {
  onDataChanged?: () => void;
  queuedPrompt?: QueuedPrompt | null;
  onNotify?: (tone: ToastTone, title: string, message: string) => void;
  highlighted?: boolean;
}) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, FeedbackValue>>({});
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextMsgId = useRef(1);
  const lastQueuedId = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (loading) {
      onNotify?.("warning", "Please wait", "ShopEase Care is still finishing the previous reply.");
      return;
    }

    const userMsg: Message = {
      id: nextMsgId.current++,
      role: "user",
      text: trimmed,
      time: nowTimeLabel(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setShowQuickMenu(false);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the last 20 messages are sent, to keep requests small.
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const result = await readSafeJson<AgentResult>(res);
      const modelMsg: Message = {
        id: nextMsgId.current++,
        role: "model",
        text: result.reply,
        time: nowTimeLabel(),
        steps: result.steps,
      };
      setMessages([...next, modelMsg]);
      if (result.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      const smart = toSmartAppError(err);
      setError(smart.message);
      onNotify?.("error", smart.title, smart.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  useEffect(() => {
    if (queuedPrompt && queuedPrompt.id !== lastQueuedId.current) {
      lastQueuedId.current = queuedPrompt.id;
      void send(queuedPrompt.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedPrompt]);

  async function copyReply(msgId: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId((curr) => (curr === msgId ? null : curr)), 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  const csatSummary = useMemo(() => {
    const values = Object.values(feedback);
    if (values.length === 0) return null;
    const positive = values.filter((v) => v === "up").length;
    return { positive, total: values.length, pct: Math.round((positive / values.length) * 100) };
  }, [feedback]);

  const lastMessage = messages[messages.length - 1];
  const showFollowUps = Boolean(!loading && lastMessage?.role === "model");

  return (
    <div
      className={
        isDark
          ? `flex h-[62dvh] min-h-[380px] max-h-[600px] flex-col overflow-hidden rounded-2xl border bg-slate-900 shadow-sm transition-all duration-300 md:h-full md:max-h-none ${
              highlighted ? "border-indigo-400 ring-2 ring-indigo-500/40" : "border-slate-800"
            }`
          : `flex h-[62dvh] min-h-[380px] max-h-[600px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 md:h-full md:max-h-none ${
              highlighted ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-200"
            }`
      }
    >
      {/* Live Support Header */}
      <div
        className={
          isDark
            ? "flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3"
            : "flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"
        }
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            SC
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">ShopEase Live Care</h2>
              <span
                className={
                  isDark
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                    : "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                }
              >
                Online · Instant
              </span>
            </div>
            <p className={isDark ? "truncate text-xs text-slate-400" : "truncate text-xs text-slate-500"}>
              Order tracking, policy-checked returns &amp; human handoff
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {csatSummary && (
            <span
              className={
                isDark
                  ? "rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                  : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
              }
            >
              Helpful: {csatSummary.pct}% ({csatSummary.positive}/{csatSummary.total})
            </span>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMessages([]);
                setFeedback({});
                setError("");
              }}
              className={
                isDark
                  ? "min-h-[36px] rounded-lg border border-slate-700 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  : "min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              }
            >
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div
              className={
                isDark
                  ? "rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 text-sm text-slate-200"
                  : "rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-sm text-slate-700"
              }
            >
              <p className="font-medium">Hi Priya — how can we help with your orders today?</p>
              <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                Pick a topic below, tap an action on any order card, or type your question.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className={
                    isDark
                      ? "block min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-left text-xs text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-800 sm:text-sm"
                      : "block min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/40 sm:text-sm"
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const msgFeedback = feedback[m.id];
          return (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "min-w-0 max-w-[88%] space-y-1 text-right"
                    : "min-w-0 max-w-[92%] space-y-2"
                }
              >
                {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} isDark={isDark} />}

                {m.role === "user" ? (
                  <>
                    <div
                      className={
                        isDark
                          ? "inline-block break-words rounded-2xl rounded-tr-sm bg-indigo-500 px-3.5 py-2.5 text-left text-sm text-white shadow-xs"
                          : "inline-block break-words rounded-2xl rounded-tr-sm bg-slate-900 px-3.5 py-2.5 text-left text-sm text-white shadow-xs"
                      }
                    >
                      {m.text}
                    </div>
                    <p className={isDark ? "text-[11px] text-slate-500" : "text-[11px] text-slate-400"}>
                      You · {m.time}
                    </p>
                  </>
                ) : (
                  <div
                    className={
                      isDark
                        ? "rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100"
                        : "rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900"
                    }
                  >
                    <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>

                    <div
                      className={
                        isDark
                          ? "mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5 text-[11px] text-slate-400"
                          : "mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-1.5 text-[11px] text-slate-500"
                      }
                    >
                      <span>ShopEase Care · {m.time}</span>
                      <div className="flex items-center gap-1">
                        <span>Helpful?</span>
                        <button
                          type="button"
                          aria-label="Helpful"
                          onClick={() => setFeedback((prev) => ({ ...prev, [m.id]: "up" }))}
                          className={
                            msgFeedback === "up"
                              ? isDark
                                ? "min-h-[28px] rounded-md bg-emerald-500/20 px-2 font-medium text-emerald-300"
                                : "min-h-[28px] rounded-md bg-emerald-100 px-2 font-medium text-emerald-800"
                              : isDark
                                ? "min-h-[28px] rounded-md px-2 hover:bg-slate-800"
                                : "min-h-[28px] rounded-md px-2 hover:bg-slate-200"
                          }
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          aria-label="Not helpful"
                          onClick={() => setFeedback((prev) => ({ ...prev, [m.id]: "down" }))}
                          className={
                            msgFeedback === "down"
                              ? isDark
                                ? "min-h-[28px] rounded-md bg-red-500/20 px-2 font-medium text-red-300"
                                : "min-h-[28px] rounded-md bg-red-100 px-2 font-medium text-red-700"
                              : isDark
                                ? "min-h-[28px] rounded-md px-2 hover:bg-slate-800"
                                : "min-h-[28px] rounded-md px-2 hover:bg-slate-200"
                          }
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => copyReply(m.id, m.text)}
                          className={
                            isDark
                              ? "min-h-[28px] rounded-md px-2 hover:bg-slate-800 hover:text-slate-200"
                              : "min-h-[28px] rounded-md px-2 hover:bg-slate-200 hover:text-slate-800"
                          }
                        >
                          {copiedId === m.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {msgFeedback === "down" && (
                      <div
                        className={
                          isDark
                            ? "mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200"
                            : "mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900"
                        }
                      >
                        <span>Want a human specialist to review this?</span>
                        <button
                          type="button"
                          onClick={() => send("Please escalate my issue to a human support specialist.")}
                          className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-500"
                        >
                          Escalate now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {showFollowUps && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {FOLLOW_UP_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => send(chip)}
                className={
                  isDark
                    ? "min-h-[34px] rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-indigo-300 hover:border-indigo-500/50 hover:bg-slate-800"
                    : "min-h-[34px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                }
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div
            className={
              isDark
                ? "inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-300"
                : "inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2 text-xs text-slate-600"
            }
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <span>ShopEase Care is checking your account...</span>
          </div>
        )}
        {error && (
          <p
            className={
              isDark
                ? "break-words rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                : "break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            }
          >
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mid-chat quick prompt drawer */}
      {showQuickMenu && (
        <div
          className={
            isDark
              ? "border-t border-slate-800 bg-slate-950/80 px-3 py-2"
              : "border-t border-slate-200 bg-slate-50 px-3 py-2"
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className={
                  isDark
                    ? "min-h-[32px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-left text-xs text-slate-200 hover:bg-slate-800"
                    : "min-h-[32px] rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className={
          isDark
            ? "flex items-center gap-2 border-t border-slate-800 bg-slate-900 p-3"
            : "flex items-center gap-2 border-t border-slate-200 bg-white p-3"
        }
      >
        <button
          type="button"
          onClick={() => setShowQuickMenu((open) => !open)}
          title="Quick prompts"
          aria-expanded={showQuickMenu}
          className={
            isDark
              ? "min-h-[44px] shrink-0 rounded-xl border border-slate-700 bg-slate-950 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              : "min-h-[44px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          }
        >
          Prompts
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about an order, return, or ticket..."
          className={
            isDark
              ? "min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400 sm:text-sm"
              : "min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 sm:text-sm"
          }
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={
            isDark
              ? "min-h-[44px] shrink-0 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
              : "min-h-[44px] shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          }
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Shows each tool call so users (and judges) can see what the agent did. */
function ToolSteps({ steps, isDark }: { steps: AgentStep[]; isDark: boolean }) {
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <details
          key={i}
          className={
            s.ok
              ? isDark
                ? "min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs"
                : "min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
              : isDark
                ? "min-w-0 max-w-full overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                : "min-w-0 max-w-full overflow-hidden rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700"
          }
        >
          <summary className="cursor-pointer select-none py-2.5 leading-5 break-words">
            <span
              className={
                s.ok
                  ? isDark
                    ? "font-medium text-emerald-400"
                    : "font-medium text-emerald-700"
                  : isDark
                    ? "font-medium text-red-400"
                    : "font-medium text-red-700"
              }
            >
              {s.ok ? "Done" : "Failed"}
            </span>
            {" · "}
            <span className="font-mono font-semibold">{s.tool}</span>
            {s.writes && (
              <span
                className={
                  isDark
                    ? "ml-2 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 font-medium text-emerald-300"
                    : "ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800"
                }
              >
                writes
              </span>
            )}
          </summary>

          <div
            className={
              isDark
                ? "mt-1 space-y-2 border-t border-slate-800 pt-2 pb-1"
                : "mt-1 space-y-2 border-t border-slate-200/70 pt-2 pb-1"
            }
          >
            <div>
              <p className={isDark ? "font-medium text-slate-400" : "font-medium text-slate-600"}>Args</p>
              <pre
                className={
                  isDark
                    ? "mt-0.5 overflow-x-auto whitespace-pre-wrap break-all text-slate-300"
                    : "mt-0.5 overflow-x-auto whitespace-pre-wrap break-all text-slate-700"
                }
              >
                {JSON.stringify(s.args ?? {}, null, 2)}
              </pre>
            </div>
            {s.ok ? (
              <div>
                <p className={isDark ? "font-medium text-slate-400" : "font-medium text-slate-600"}>Result</p>
                <pre
                  className={
                    isDark
                      ? "mt-0.5 overflow-x-auto whitespace-pre-wrap break-all text-slate-300"
                      : "mt-0.5 overflow-x-auto whitespace-pre-wrap break-all text-slate-700"
                  }
                >
                  {JSON.stringify(s.result ?? null, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <p className={isDark ? "font-medium text-red-300" : "font-medium text-red-700"}>Error</p>
                <p className={isDark ? "mt-0.5 whitespace-pre-wrap break-words text-red-300" : "mt-0.5 whitespace-pre-wrap break-words text-red-700"}>
                  {s.error ?? "Tool failed"}
                </p>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
