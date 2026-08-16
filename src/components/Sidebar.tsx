"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import GlassButton from "./GlassButton";
import ThemeToggle from "./ThemeToggle";
import ModelSelector from "./ModelSelector";
import SessionSearch from "./SessionSearch";
import ExportButton from "./ExportButton";

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  groqKey: string;
  onGroqKeyChange: (key: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  groqKey,
  onGroqKeyChange,
}: SidebarProps) {
  const { data: session } = useSession();
  const [keyInput, setKeyInput] = useState(groqKey);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setKeyInput(groqKey), [groqKey]);

  return (
    <aside className="glass-panel glass-panel--sidebar flex h-full w-72 shrink-0 flex-col gap-5 border-r border-amber/10 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg leading-none text-amber">Marginalia</p>
          <p className="mt-1 text-xs text-ash">notes in the margins of arXiv</p>
        </div>
        <ThemeToggle />
      </div>

      <GlassButton variant="amber" onClick={onNewSession} className="w-full">
        + New research thread
      </GlassButton>

      <SessionSearch onSelect={onSelectSession} sessions={sessions} />

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        <p className="mb-1 px-1 text-xs uppercase tracking-wide text-ash">Sessions</p>
        {sessions.length === 0 && (
          <p className="px-1 text-xs text-ash">No threads yet — start one above.</p>
        )}
        {sessions.map((s) => (
          <motion.button
            key={s.id}
            whileHover={{ x: 2 }}
            onClick={() => onSelectSession(s.id)}
            className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              s.id === activeSessionId
                ? "border border-amber/30 bg-amber/10 text-amber"
                : "text-paper/80 hover:bg-amber/5"
            }`}
            title={s.title}
          >
            {s.title}
          </motion.button>
        ))}
      </div>

      <div className="space-y-2 border-t border-amber/10 pt-4">
        <label htmlFor="groq-key" className="text-xs uppercase tracking-wide text-ash">
          Your Groq API key
        </label>
        <div className="flex items-center gap-2">
          <input
            id="groq-key"
            type={revealed ? "text" : "password"}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onBlur={() => onGroqKeyChange(keyInput)}
            placeholder="gsk_..."
            className="w-full rounded-lg border border-amber/15 bg-ink/60 px-3 py-2 text-sm text-paper placeholder:text-ash focus:border-amber/50"
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-xs text-ash hover:text-amber"
            aria-label={revealed ? "Hide key" : "Show key"}
          >
            {revealed ? "hide" : "show"}
          </button>
        </div>
        <p className="text-[11px] leading-snug text-ash">
          Stored only in your browser. Never sent anywhere but Groq.
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-amber/10 pt-4">
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs text-ash">{session?.user?.name}</span>
          <ModelSelector />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-ash hover:text-amber"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
