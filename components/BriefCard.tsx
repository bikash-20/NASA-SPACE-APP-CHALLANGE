"use client";

import { useEffect, useRef, useState } from "react";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
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
        <p key={i} className="mt-2 first:mt-0 text-ink">
          {inline(line)}
        </p>
      );
    } else if (line.length === 0) {
      out.push(<div key={i} className="h-1" />);
    } else {
      out.push(
        <p key={i} className="text-white/80">
          {inline(line)}
        </p>
      );
    }
  });
  flush();
  return <div className="text-sm leading-relaxed">{out}</div>;
}

export function BriefCard({
  crew,
  alerts,
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
    // distance from bottom in px
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
    <Panel tone="accent" className="flex flex-col">
      <PanelTitle
        title="Flight surgeon brief"
        right={
          <Button
            variant="primary"
            onClick={onWriteBrief}
            disabled={briefLoading}
          >
            {briefLoading ? "Writing…" : brief ? "Rewrite brief" : "Write brief"}
          </Button>
        }
      />

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
            <p className="mt-3 text-[11px] text-white/40">
              model · <span className="font-mono">{briefModel}</span>
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-white/50">
          {briefLoading
            ? "Asking the LLM via OpenRouter…"
            : "No brief yet. Click Write brief to generate one from the live snapshot of " +
              crew.n +
              "."}
        </p>
      )}

      {/* Sticky chat thread: fixed max height, scrolls internally. Input is pinned below. */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Ask the surgeon
          </div>
          {!stickToBottom && chat.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStickToBottom(true);
                const el = scrollRef.current;
                if (el) el.scrollTop = el.scrollHeight;
              }}
              className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/25"
            >
              ↓ Jump to latest
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="max-h-[320px] min-h-[120px] flex-1 space-y-2 overflow-y-auto rounded-md border border-white/5 bg-white/[0.015] p-2 no-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.15) transparent",
          }}
        >
          {chat.length === 0 && !chatStreaming && (
            <div className="flex h-full min-h-[96px] items-center justify-center text-center text-[12px] text-white/40">
              Ask follow-up questions about {crew.n}. Answers use the same
              snapshot the brief was written from.
            </div>
          )}
          {chat.map((m, i) => (
            <div
              key={i}
              className={`rounded-md p-2 text-sm ${
                m.role === "user"
                  ? "bg-accent/15 text-ink"
                  : "bg-white/[0.04] text-white/80"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider text-white/40">
                {m.role === "user" ? "you" : "surgeon"}
              </span>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          ))}
          {chatStreaming && (
            <div className="rounded-md bg-white/[0.04] p-2 text-sm text-white/60">
              <span className="block text-[10px] uppercase tracking-wider text-white/40">
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
          className="mt-2 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this crew member…"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50"
            disabled={chatStreaming}
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
          <p className="mt-1.5 text-[11px] text-white/40">
            chat model · <span className="font-mono">{chatModel}</span>
          </p>
        )}
      </div>
    </Panel>
  );
}
