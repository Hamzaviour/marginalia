"use client";

import { motion } from "framer-motion";

/**
 * Ambient page backdrop: a large soft amber glow anchoring the hero area,
 * plus a handful of small violet/rose orbs drifting on independent float
 * cycles. Pure CSS/SVG + Framer Motion — no external component license
 * required, but built to read the same as the Framer "AnimatedGlowShape"
 * and "Floating Animation" components.
 */
export default function GlowBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="absolute left-1/2 top-[-10%] h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(232,163,61,0.55) 0%, rgba(232,163,61,0) 70%)",
        }}
      />

      <div className="absolute right-[8%] top-[18%] h-40 w-40 animate-float rounded-full bg-glow-violet/25 blur-2xl" />
      <div className="absolute left-[6%] top-[45%] h-24 w-24 animate-float-slow rounded-full bg-glow-rose/20 blur-2xl" />
      <div className="absolute bottom-[10%] right-[20%] h-32 w-32 animate-float rounded-full bg-amber/20 blur-2xl" />

      {/* faint grid, evokes ruled notebook paper without literal lines everywhere */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,240,230,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,230,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
