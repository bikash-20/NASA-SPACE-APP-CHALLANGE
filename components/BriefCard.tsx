"use client";

import type { ReactElement } from "react";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import type { Crew } from "@/lib/types";

interface BriefCardProps {
  crew: Crew;
  brief: string | null;
  briefModel: string | null;
  briefLoading: boolean;
  briefError: string | null;
  onWriteBrief: () => void;
}

/** Minimal Markdown -> JSX (no external dep). Just headings + bullets. */
function Md({ children }: { children: string }) {
  const lines = children.split("\n");
  const out: ReactElement[] = [];
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
  const inline = (s: string): ReactElement[] => {
    const parts: (string | ReactElement)[] = [];
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
  onWriteBrief,
  brief,
  briefModel,
  briefLoading,
  briefError,
}: BriefCardProps) {
  return (
    <Panel tone="accent" className="flex h-full min-h-0 flex-col">
      <PanelTitle
        title="Simulation brief"
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
        {briefError && (
          <p className="mb-2 rounded-lg border border-bad/25 bg-bad/10 p-2 text-sm text-rose-100" role="alert">
            {briefError}
          </p>
        )}
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
    </Panel>
  );
}
