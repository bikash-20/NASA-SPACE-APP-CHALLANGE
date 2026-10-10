"use client";

import { useEffect, useRef, useState } from "react";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { useStickyScroll } from "@/hooks/useStickyScroll";
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
 * The chat thread is a fixed-height, internally-scrollable region pinned
 * to the bottom of its own scroll area. As the assistant streams a reply,
 * the latest token stays visible at the bottom without the user needing to
 * scroll. Scrolling up reveals history. A floating "Jump to latest" pill
 * appears whenever the user is not pinned, and vanishes when they tap it
 * (or auto-snap when they send a new message).
 */
export function AskCard({
  crew,
  chat,
  chatStreaming,
  chatModel,
  onSendChat,
}: AskCardProps) {
  const [input, setInput] = useState("");
  const messageCount = chat.length;

  const { ref: scrollRef, isAtBottom, onScroll, scrollToBottom } =
    useStickyScroll<HTMLDivElement>([chat, chatStreaming, messageCount]);

  // After sending a message, snap to the bottom regardless of where the
  // user had been reading. The user expects new outgoing traffic to land
  // at the bottom.
  const wasStreaming = useRef(false);
  useEffect(() => {
    if (chatStreaming) {
      wasStreaming.current = true;
      return;
    }
    if (wasStreaming.current) {
      wasStreaming.current = false;
      scrollToBottom();
    }
  }, [chatStreaming, scrollToBottom]);

  const send = () => {
    const v = input.trim();
    if (!v || chatStreaming) return;
    setInput("");
    // Force-pin before the stream begins so the first token is visible.
    scrollToBottom();
    onSendChat(v);
  };

  return (
    <Panel tone="accent" className="flex h-full min-h-0 flex-col">
      <PanelTitle title="Ask the surgeon" hint={crew.n} />

      <div className="mb-2 text-sm text-white/65">
        Follow-up questions about the current snapshot. The model never raises
        alerts — rules do that.
      </div>

      {/* Sticky chat thread: grows inside a fixed-height region and
          scrolls internally. The fade mask (in globals.css under
          [data-sticky-scroll]) hints that the content scrolls. */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          data-sticky-scroll={isAtBottom ? "pinned" : "detached"}
          className="chat-scroll absolute inset-0 overflow-y-auto overscroll-contain rounded-md border border-white/5 bg-white/[0.02] p-2"
        >
          {chat.length === 0 && !chatStreaming && (
            <div className="flex h-full min-h-[160px] items-center justify-center text-center text-sm text-white/55">
              Ask {crew.n} anything — vitals, recent alerts, what to do next.
              Answers use the same snapshot the brief was written from.
            </div>
          )}
          {chat.map((m, i) => (
            <div
              key={i}
              className={`mb-2 rounded-md p-2 text-sm ${
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

        {/* Floating "Jump to latest" pill, anchored over the scroll
            region so the fade mask doesn't clip it. Only rendered when
            the user has scrolled away. */}
        {!isAtBottom && chat.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="pointer-events-auto absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-accent/50 bg-accent/85 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-black/40 hover:bg-accent"
          >
            ↓ Jump to latest
          </button>
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
        {chatModel && (
          <span>
            model · <span className="font-mono">{chatModel}</span>
          </span>
        )}
      </div>
    </Panel>
  );
}
