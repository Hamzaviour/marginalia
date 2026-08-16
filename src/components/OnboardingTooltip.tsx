"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "marginalia-onboarded";

export default function OnboardingTooltip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber/30 bg-ink/90 p-4 text-sm text-paper backdrop-blur">
      <div className="flex items-start justify-between">
        <p>Welcome to Marginalia! To get started:</p>
        <button onClick={dismiss} className="ml-2 text-ash hover:text-paper">✕</button>
      </div>
      <ol className="mt-2 list-inside list-decimal space-y-1 text-ash">
        <li>Add your Groq API key in the sidebar</li>
        <li>Start a new research thread</li>
        <li>Ask about any arXiv topic</li>
      </ol>
      <p className="mt-2 text-xs text-ash">
        Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-amber hover:underline">console.groq.com</a>
      </p>
    </div>
  );
}
