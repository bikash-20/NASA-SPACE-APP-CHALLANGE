"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import { cn } from "@/lib/cn";
import type { ChatMessage, Crew } from "@/lib/types";

interface AskCardProps {
  crew: Crew;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  chatError: string | null;
  onSendChat: (text: string) => void;
}

/**
 * Chat-only card. Renders the streaming conversation in a flex column that
 * pins the header, gives the message list ALL remaining height, and pins the
 * input + footer at the bottom. The intro hint is a one-liner under the title
 * and disappears as soon as the first message exists.
 */
export function AskCard({
  crew,
  chat,
  chatStreaming,
  chatModel,
  chatError,
  onSendChat,
}: AskCardProps) {
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const messageCount = chat.filter((m) => m.role === "user").length;
  const showIntro = chat.length === 0 && !chatStreaming;

  const submit = useCallback(() => {
    const v = input.trim();
    if (!v || chatStreaming) return;
    setInput("");
    onSendChat(v);
  }, [input, chatStreaming, onSendChat]);

  return (
    <>
      <Panel
        tone="accent"
        density="compact"
        className="flex h-full min-h-0 flex-col overflow-hidden"
        data-ask-card
      >
        <ChatHeader
          crew={crew}
          showIntro={showIntro}
          expanded={expanded}
          onExpand={() => setExpanded(true)}
        />

        <MessageList
          chat={chat}
          chatStreaming={chatStreaming}
          crewName={crew.n}
        />

        <ChatInputBar
          input={input}
          setInput={setInput}
          chatStreaming={chatStreaming}
          onSubmit={submit}
        />

        <FooterLine messageCount={messageCount} chatModel={chatModel} />

        {chatError && (
          <p className="mt-1 text-sm text-bad" role="alert">
            {chatError}
          </p>
        )}
      </Panel>

      <AnimatePresence>
        {expanded && (
          <ExpandedChatOverlay
            crew={crew}
            chat={chat}
            chatStreaming={chatStreaming}
            chatModel={chatModel}
            chatError={chatError}
            input={input}
            setInput={setInput}
            messageCount={messageCount}
            onSendChat={onSendChat}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------ Header ------------------------------ */

function ChatHeader({
  crew,
  showIntro,
  expanded,
  onExpand,
}: {
  crew: Crew;
  showIntro: boolean;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[0.95rem] font-semibold leading-tight tracking-tight text-ink">
            Chat with the assistant
          </h2>
          <span className="shrink-0 rounded-full border border-accent/50 px-2 py-px text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">
            {crew.n}
          </span>
        </div>
        {showIntro && (
          <p className="mt-px truncate text-xs text-white/65">
            Ask about the crew snapshot. Only the rules engine raises alerts.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand chat"
        title="Expand chat"
        className={cn(
          "tappable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10 hover:text-ink",
          expanded && "hidden"
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-4 w-4"
        >
          <path d="M4 9V4h5M16 11v5h-5" strokeLinecap="round" />
          <path d="M9 4l-3 0M11 16l3 0" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/* ---------------------------- Message list -------------------------- */

function MessageList({
  chat,
  chatStreaming,
  crewName,
}: {
  chat: ChatMessage[];
  chatStreaming: boolean;
  crewName: string;
}) {
  const { ref: scrollRef, isAtBottom, onScroll, scrollToBottom } =
    useStickyScroll<HTMLDivElement>([chat, chatStreaming]);

  return (
    <div
      className="chat-message-region relative mt-2 min-h-[320px] flex-1"
    >
      <div
        ref={scrollRef}
        onScroll={onScroll}
        data-sticky-scroll={isAtBottom ? "pinned" : "detached"}
        role="log"
        aria-label="Conversation"
        aria-relevant="additions text"
        className="chat-scroll absolute inset-0 overflow-y-auto overscroll-contain rounded-md border border-white/5 bg-white/[0.02] px-3 pb-12 pt-2"
      >
        {chat.length === 0 && !chatStreaming ? (
          <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-white/55">
            Start a conversation. Ask about {crewName}&apos;s simulated health
            or anything else.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chat.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {chatStreaming && <TypingBubble />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!isAtBottom && chat.length > 0 && (
          <motion.button
            type="button"
            onClick={scrollToBottom}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            aria-label="Jump to latest message"
            className="pointer-events-auto absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/90 px-3 py-1.5 text-xs font-semibold text-bg-deep shadow-lg shadow-black/40 hover:bg-accent"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-3 w-3"
            >
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "chat-bubble max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[1.0625rem] leading-[1.6]",
          isUser
            ? "rounded-br-md bg-accent/85 text-bg-deep"
            : "rounded-bl-md border border-white/10 bg-white/[0.05] text-ink"
        )}
        style={{ overflowWrap: "anywhere", wordBreak: "normal" }}
      >
        {isUser ? message.content : <AssistantMarkdown text={message.content} />}
      </div>
    </div>
  );
}

function AssistantMarkdown({ text }: { text: string }) {
  // Lightweight markdown: paragraphs (blank-line separated), bullets (- ),
  // and **bold**. Keeps the assistant's full reply intact — never truncates.
  const blocks: React.ReactNode[] = [];
  const paragraphs = text.split(/\n{2,}/);
  let key = 0;
  for (const para of paragraphs) {
    const trimmed = para.trimEnd();
    if (trimmed.length === 0) continue;
    if (trimmed.includes("\n") && trimmed.split("\n").every((l) => l.startsWith("- "))) {
      const items = trimmed
        .split("\n")
        .map((l) => l.replace(/^-\s+/, "").trim())
        .filter(Boolean);
      blocks.push(
        <ul key={key++} className="ml-5 list-disc space-y-1.5">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    } else {
      const lines = trimmed.split("\n");
      blocks.push(
        <p key={key++} className="space-y-1.5">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {renderInline(line)}
            </span>
          ))}
        </p>
      );
    }
  }
  return <div className="space-y-2.5">{blocks}</div>;
}

function renderInline(s: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    parts.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function TypingBubble() {
  return (
    <div className="flex w-full justify-start" aria-live="polite">
      <div className="chat-bubble max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3 text-[1.0625rem] leading-[1.6] text-ink">
        <span className="sr-only">Assistant is typing</span>
        <span aria-hidden className="inline-flex items-center gap-1 align-middle">
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:0ms]" />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:120ms]" />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:240ms]" />
          <span className="ml-2 text-sm text-white/65">Typing…</span>
        </span>
      </div>
    </div>
  );
}

/* ----------------------------- Input bar ---------------------------- */

function ChatInputBar({
  input,
  setInput,
  chatStreaming,
  onSubmit,
}: {
  input: string;
  setInput: (v: string) => void;
  chatStreaming: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mt-1 flex shrink-0 gap-2"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message…"
        maxLength={1200}
        disabled={chatStreaming}
        inputMode="text"
        autoComplete="off"
        aria-label="Message the assistant"
        aria-describedby="ask-card-message-limit"
        className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-base text-ink placeholder:text-white/40 focus:outline-none"
        style={{ fontSize: "1rem", height: "36px", padding: "0 12px" }}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={chatStreaming || !input.trim()}
      >
        Send
      </Button>
      <p
        id="ask-card-message-limit"
        className="sr-only"
      >
        Messages are limited to 1,200 characters.
      </p>
    </form>
  );
}

function FooterLine({
  messageCount,
  chatModel,
}: {
  messageCount: number;
  chatModel: string | null;
}) {
  // The model name is exposed only via the title attribute (tooltip on
  // hover) and a one-time console log — never in the visible UI.
  const ref = useRef<string | null>(null);
  if (chatModel && ref.current !== chatModel) {
    ref.current = chatModel;
    if (typeof console !== "undefined") {
      console.info("[chat] model:", chatModel);
    }
  }
  return (
    <p
      data-ask-footer
      className="mt-1 flex shrink-0 items-center justify-between gap-2 text-sm text-white/55"
      title={chatModel ? `Model: ${chatModel}` : undefined}
    >
      <span>
        {messageCount === 0
          ? "No messages yet"
          : `${messageCount} message${messageCount === 1 ? "" : "s"} · 1,200 char limit`}
      </span>
    </p>
  );
}

/* ------------------------- Expanded overlay ------------------------- */

function ExpandedChatOverlay({
  crew,
  chat,
  chatStreaming,
  chatModel,
  chatError,
  input,
  setInput,
  messageCount,
  onSendChat,
  onClose,
}: {
  crew: Crew;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  chatError: string | null;
  input: string;
  setInput: (v: string) => void;
  messageCount: number;
  onSendChat: (text: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const list = Array.from(focusable);
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Centering wrapper. The motion.div below animates `transform` for
         the open/close effect, which would otherwise clobber the
         `-translate-x-1/2` / `-translate-y-1/2` Tailwind utilities. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-chat-title"
        className="fixed left-1/2 top-1/2 z-50 flex h-[80dvh] max-h-[80dvh] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col"
      >
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-deep p-4 shadow-2xl"
        >
          <ChatHeader
            crew={crew}
            showIntro={chat.length === 0 && !chatStreaming}
            expanded
            onExpand={() => {
              /* already expanded */
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expanded chat"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10 hover:text-ink"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>

          <MessageList
            chat={chat}
            chatStreaming={chatStreaming}
            crewName={crew.n}
          />

          <ChatInputBar
            input={input}
            setInput={setInput}
            chatStreaming={chatStreaming}
            onSubmit={() => {
              const v = input.trim();
              if (!v || chatStreaming) return;
              setInput("");
              onSendChat(v);
            }}
          />

          <FooterLine messageCount={messageCount} chatModel={chatModel} />

          {chatError && (
            <p className="mt-1 text-sm text-bad" role="alert">
              {chatError}
            </p>
          )}
        </motion.div>
      </div>
    </>,
    document.body
  );
}
