"use client";

import { useEffect, useRef, useState } from "react";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import type { Alert, ChatMessage, Crew } from "@/lib/types";

interface BriefCardProps {
  crew: Crew;
  alerts: Alert[];
  brief: string | null;
  briefModel: string | null;
  briefLoading: boolean;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  onWriteBrief: () => void;
  onSendChat: (text: string) => void;
}

/** Minimal Markdown -> JSX (no external dep). Just headings + bullets. */
function Md({ children }: { children: string }) {
  const lines = children.split("\n");
  const out: JSX.Element[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={out.length} className="ml-4 list-disc space-y-1">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };
  const inline = (s: string): JSX.Element[] => {
    const parts: (string | JSX.Element)[] = [];
    const re = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      parts.push(
        <b key={`b${key++}`} className="text-ink">
          {m[1]}
        </b>
      );
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.map((p, i) =>
      typeof p === "string" ? <span key={i}>{p}</span> : p
    );
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flush();
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      out.push(
        <p key={i} className="mt-2 first:mt-0 text-base text-ink">
          {inline(line)}
        </p>
      );
    } else if (line.length === 0) {
      out.push(<div key={i} className="h-1" />);
    } else {
      out.push(
        <p key={i} className="text-base text-white/85">
          {inline(line)}
        </p>
      );
    }
  });
  flush();
  return <div className="leading-relaxed">{out}</div>;
}

export function BriefCard({
  crew,
  brief,
  briefModel,
  briefLoading,
  chat,
  chatStreaming,
  chatModel,
  onWriteBrief,
  onSendChat,
}: BriefCardProps) {
  const [input, setInput] = useState("");
  const messageCount = chat.length;
  const {
    ref: scrollRef,
    isAtBottom: stickToBottom,
    onScroll,
    scrollToBottom,
  } = useStickyScroll<HTMLDivElement>([chat, chatStreaming, messageCount]);

  // After a stream finishes, snap to the bottom so the user sees the
  // completed reply without having to scroll.
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
    scrollToBottom();
    onSendChat(v);
  };

  return (
    <Panel tone="accent" className="flex h-full min-h-0 flex-col">
      <PanelTitle
        title="Flight surgeon brief"
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={onWriteBrief}
            disabled={briefLoading}
          >
            {briefLoading ? "Writing…" : brief ? "Rewrite" : "Write brief"}
          </Button>
        }
      />

      <div className="min-h-0 flex-shrink-0 overflow-y-auto pb-2">
        {brief ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={brief}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Md>{brief}</Md>
              </motion.div>
            </AnimatePresence>
            {briefModel && (
              <p className="mt-2 text-sm text-white/65">
                model · <span className="font-mono">{briefModel}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-white/65">
            {briefLoading
              ? "Asking the LLM via OpenRouter…"
              : `No brief yet. Click Write brief to generate one from the live snapshot of ${crew.n}.`}
          </p>
        )}
      </div>

      {/* Sticky chat thread: fills the remaining vertical space, scrolls
          internally, and pins the latest message to the bottom unless the
          user has scrolled up to read history. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-3">
        <div className="mb-2 text-sm font-semibold text-white/70">
          Ask the surgeon
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            data-sticky-scroll={stickToBottom ? "pinned" : "detached"}
            className="chat-scroll absolute inset-0 overflow-y-auto overscroll-contain rounded-md border border-white/5 bg-white/[0.02] p-2"
          >
            {chat.length === 0 && !chatStreaming && (
              <div className="flex h-full min-h-[80px] items-center justify-center text-center text-sm text-white/55">
                Ask follow-up questions about {crew.n}. Answers use the same
                snapshot the brief was written from.
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
              region so the fade mask doesn't clip it. */}
          {!stickToBottom && chat.length > 0 && (
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
          className="mt-2 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this crew member…"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-base text-ink placeholder:text-white/40 focus:outline-none"
            disabled={chatStreaming}
            inputMode="text"
            autoComplete="off"
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
        {chatModel && (
          <p className="mt-1.5 text-sm text-white/65">
            chat model · <span className="font-mono">{chatModel}</span>
          </p>
        )}
      </div>
    </Panel>
  );
}
