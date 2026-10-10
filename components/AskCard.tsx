"use client";

import { useEffect, useRef, useState } from "react";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import type { ChatMessage, Crew } from "@/lib/types";

interface AskCardProps {
  crew: Crew;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  onSendChat: (text: string) => void;
}

/**
 * Chat-only card. Renders the crew-aware greeting, the streaming message
 * thread, and the input form. The brief text and the "Write brief" button
 * are NOT rendered here — that lives in BriefCard on the "Brief" tab.
 *
 * This card is mounted in the tabbed panel under the "Ask the surgeon" tab.
 * It re-uses the same scroll-to-bottom pattern as BriefCard so the input
 * stays visible and the latest assistant message is always in view.
 */
export function AskCard({
  crew,
  chat,
  chatStreaming,
  chatModel,
  onSendChat,
}: AskCardProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  // Auto-scroll to bottom when chat grows, unless the user has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat, chatStreaming, stickToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distance < 32);
  };

  const send = () => {
    const v = input.trim();
    if (!v || chatStreaming) return;
    setInput("");
    setStickToBottom(true);
    onSendChat(v);
  };

  return (
    <Panel tone="accent" className="flex h-full min-h-0 flex-col">
      <PanelTitle
        title="Ask the surgeon"
        hint={crew.n}
      />

      <div className="mb-2 text-sm text-white/65">
        Follow-up questions about the current snapshot. The model never raises
        alerts — rules do that.
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-md border border-white/5 bg-white/[0.015] p-2"
      >
        {chat.length === 0 && !chatStreaming && (
          <div className="flex h-full min-h-[120px] items-center justify-center text-center text-sm text-white/55">
            Ask {crew.n} anything — vitals, recent alerts, what to do next.
            Answers use the same snapshot the brief was written from.
          </div>
        )}
        {chat.map((m, i) => (
          <div
            key={i}
            className={`rounded-md p-2 text-sm ${
              m.role === "user"
                ? "bg-accent/15 text-ink"
                : "bg-white/[0.04] text-white/85"
            }`}
          >
            <span className="block text-sm uppercase tracking-wider text-white/55">
              {m.role === "user" ? "you" : "surgeon"}
            </span>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
        {chatStreaming && (
          <div className="rounded-md bg-white/[0.04] p-2 text-sm text-white/65">
            <span className="block text-sm uppercase tracking-wider text-white/55">
              surgeon
            </span>
            <span className="inline-block h-3 w-1.5 animate-pulse bg-accent align-middle" />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-2 flex shrink-0 gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${crew.n}…`}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-base text-ink placeholder:text-white/40 focus:outline-none"
          disabled={chatStreaming}
          inputMode="text"
          autoComplete="off"
          aria-label={`Ask the surgeon about ${crew.n}`}
          style={{ fontSize: "1rem" }}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={chatStreaming || !input.trim()}
        >
          Send
        </Button>
      </form>

      <div className="mt-1.5 flex min-h-[1.25rem] items-center justify-between text-sm text-white/55">
        <span>
          {chat.length > 0
            ? `${chat.filter((m) => m.role === "user").length} question${
                chat.filter((m) => m.role === "user").length === 1 ? "" : "s"
              }`
            : "No questions yet"}
        </span>
        <div className="flex items-center gap-2">
          {!stickToBottom && chat.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStickToBottom(true);
                const el = scrollRef.current;
                if (el) el.scrollTop = el.scrollHeight;
              }}
              className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/25"
            >
              ↓ Jump to latest
            </button>
          )}
          {chatModel && (
            <span>
              model · <span className="font-mono">{chatModel}</span>
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}
