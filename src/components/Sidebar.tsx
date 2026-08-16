"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import GlassButton from "./GlassButton";
import ThemeToggle from "./ThemeToggle";
import SessionSearch from "./SessionSearch";
import ExportButton from "./ExportButton";
import { PROVIDERS, DEFAULT_PROVIDER, type ProviderId } from "@/lib/providers";

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
  provider: ProviderId;
  onProviderChange: (provider: ProviderId) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const LOGO_ICONS: Record<string, JSX.Element> = {
  Lightning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  "Blue Circle": (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  Fire: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  "Green Circle": (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  "Light Bulb": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  "Red Circle": (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  Arrows: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Globe: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
    </svg>
  ),
};

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  provider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
}: SidebarProps) {
  const { data: session } = useSession();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [revealed, setRevealed] = useState(false);
  const [showDocsLink, setShowDocsLink] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  useEffect(() => setKeyInput(apiKey), [apiKey]);

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
        <label htmlFor="provider-select" className="text-xs uppercase tracking-wide text-ash">
          Provider
        </label>
        <select
          id="provider-select"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderId)}
          className="w-full rounded-lg border border-amber/15 bg-ink/60 px-3 py-2 text-sm text-paper focus:border-amber/50"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label htmlFor="api-key" className="text-xs uppercase tracking-wide text-ash">
          API key
        </label>
        <div className="relative">
          <input
            id="api-key"
            type={revealed ? "text" : "password"}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={currentProvider.keyPlaceholder}
            onFocus={() => setShowDocsLink(true)}
            onBlur={(e) => {
              setShowDocsLink(false);
              onApiKeyChange(e.currentTarget.value);
            }}
            className="w-full rounded-lg border border-amber/15 bg-ink/60 px-3 py-2 pr-20 text-sm text-paper placeholder:text-ash focus:border-amber/50"
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ash hover:text-amber"
            aria-label={revealed ? "Hide key" : "Show key"}
          >
            {revealed ? "hide" : "show"}
          </button>
        </div>

        {showDocsLink && (
          <a
            href={currentProvider.apiKeyDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-ash underline hover:text-amber"
          >
            Get API key for {currentProvider.name}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <p className="text-[11px] leading-snug text-ash">
          Stored only in your browser. Never sent anywhere but {currentProvider.name}.
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-amber/10 pt-4">
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs text-ash">{session?.user?.name}</span>
        </div>
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="text-xs text-ash hover:text-amber"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
