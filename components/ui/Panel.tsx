"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  highlight?: boolean;
  tone?: "default" | "accent" | "ok";
  density?: "comfortable" | "compact";
  as?: "div" | "section" | "aside";
}

export function Panel({
  children,
  className,
  highlight,
  tone = "default",
  density = "comfortable",
  as = "div",
  ...rest
}: PanelProps) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-md",
        density === "comfortable" ? "p-4 sm:p-5" : "p-3",
        "bg-white/[0.03] border-white/10",
        tone === "accent" && "border-accent/40",
        tone === "ok" && "border-ok/30",
        highlight && "ring-2 ring-accent/70",
        className
      )}
      {...(rest as any)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)",
        }}
      />
      {children}
    </Tag>
  );
}

export function PanelTitle({
  title,
  right,
  tone,
  hint,
  id,
}: {
  title: string;
  right?: ReactNode;
  tone?: "ok" | "accent";
  hint?: string;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2
        id={id}
        className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
      >
        <span>{title}</span>
        {tone && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider",
              tone === "ok"
                ? "border-ok/50 text-ok"
                : "border-accent/50 text-accent"
            )}
            style={{ letterSpacing: "0.04em" }}
          >
            {tone === "ok" ? "decides" : "advises only"}
          </span>
        )}
      </h2>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  );
}
