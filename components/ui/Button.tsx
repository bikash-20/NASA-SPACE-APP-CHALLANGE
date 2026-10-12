"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "active" | "danger" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}

export function Button({
  children,
  className,
  variant = "default",
  size = "md",
  block = false,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border text-base font-medium leading-none transition-colors",
        "focus-visible:outline-none",
        // sizes
        size === "sm" && "min-h-[44px] px-2.5 py-1.5 text-sm",
        size === "md" && "min-h-[40px] sm:min-h-[44px] px-3 py-2 text-base",
        size === "lg" && "min-h-[48px] px-4 py-2.5 text-base",
        block && "w-full",
        // variants
        variant === "default" &&
          "border-white/10 bg-white/5 text-ink hover:bg-white/10",
        variant === "ghost" &&
          "border-transparent bg-transparent text-white/80 hover:bg-white/5 hover:text-ink",
        variant === "active" && "border-ink bg-ink text-bg",
        variant === "danger" &&
          "border-bad/40 bg-bad/10 text-bad hover:bg-bad/20",
        variant === "primary" &&
          "border-accent bg-accent text-bg-deep hover:bg-accent-soft",
        className
      )}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
