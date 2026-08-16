"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "amber" | "ghost";
}

/**
 * Recreates the "fluid glass button" feel: translucent surface, soft
 * inner highlight, and a gentle press/hover spring rather than a hard
 * color swap.
 */
export default function GlassButton({
  children,
  variant = "amber",
  className = "",
  ...props
}: GlassButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    amber:
      "bg-amber/90 text-ink shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_24px_-8px_rgba(232,163,61,0.6)] hover:bg-amber-bright",
    ghost:
      "glass-panel text-paper hover:border-amber/40 border border-amber/10",
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
