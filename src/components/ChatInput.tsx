"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import GlassButton from "./GlassButton";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

function estimateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [value]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  const readingTime = estimateReadingTime(value);

  return (
    <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-2 rounded-2xl border border-amber/15 p-3">
      <div className="flex flex-1 gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask about any topic — Marginalia will search arXiv and answer with citations…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-[15px] text-paper placeholder:text-ash focus:outline-none"
        />
        <GlassButton type="submit" variant="amber" disabled={disabled || !value.trim()}>
          {disabled ? "Searching…" : "Send"}
        </GlassButton>
      </div>
      {value.trim() && (
        <p className="text-[11px] text-ash">{readingTime}</p>
      )}
    </form>
  );
}
