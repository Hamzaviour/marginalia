"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("marginalia-theme");
    const light = stored === "light";
    setIsLight(light);
    document.documentElement.classList.toggle("light", light);
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.add("theme-transition");
    setTimeout(() => document.documentElement.classList.remove("theme-transition"), 300);
    localStorage.setItem("marginalia-theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      aria-pressed={isLight}
      className="glass-panel flex h-9 w-16 items-center rounded-full border border-amber/15 px-1"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-amber text-xs text-ink"
        style={{ marginLeft: isLight ? "auto" : 0 }}
      >
        {isLight ? "☀" : "☾"}
      </motion.span>
    </button>
  );
}
