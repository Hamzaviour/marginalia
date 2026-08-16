"use client";

import { useState } from "react";
import { GROQ_MODELS } from "@/lib/groq";

const MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B (Best)",
  "llama-3.1-8b": "Llama 3.1 8B (Fast)",
  "deepseek-r1": "DeepSeek R1 (Reasoning)",
  "qwen-2.5": "Qwen 2.5",
  "mixtral-8x7b": "Mixtral 8x7B",
};

const STORAGE_KEY = "marginalia-model";

export default function ModelSelector() {
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE_KEY) ?? GROQ_MODELS[0]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setModel(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <select
      value={model}
      onChange={handleChange}
      className="rounded-lg border border-amber/15 bg-ink/40 px-2 py-1 text-xs text-paper focus:border-amber/50"
    >
      {GROQ_MODELS.map((m) => (
        <option key={m} value={m}>
          {MODEL_LABELS[m] ?? m}
        </option>
      ))}
    </select>
  );
}
