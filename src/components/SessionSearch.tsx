"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionSummary } from "./Sidebar";

interface Props {
  onSelect: (id: string) => void;
  sessions: SessionSummary[];
}

export default function SessionSearch({ onSelect, sessions }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SessionSummary[]>(sessions);
  const [searching, setSearching] = useState(false);

  const debouncedSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(sessions);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/sessions/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.sessions ?? []);
      }
    } finally {
      setSearching(false);
    }
  }, [sessions]);

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search sessions…"
        className="w-full rounded-lg border border-amber/15 bg-ink/60 px-3 py-2 text-sm text-paper placeholder:text-ash focus:border-amber/50"
      />
      {searching && <span className="absolute right-3 top-2.5 text-xs text-ash">…</span>}
      {query && !searching && results.length === 0 && (
        <p className="mt-1 text-xs text-ash">No sessions found</p>
      )}
    </div>
  );
}
