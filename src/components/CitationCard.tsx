"use client";

import { motion } from "framer-motion";

export interface Citation {
  index: number;
  title: string;
  authors: string[];
  arxivId: string;
  url: string;
  year: string;
}

export default function CitationCard({ citation }: { citation: Citation }) {
  const authorLine =
    citation.authors.length > 2
      ? `${citation.authors[0]} et al.`
      : citation.authors.join(", ") || "Unknown authors";

  return (
    <motion.a
      href={citation.url}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -3, borderColor: "rgba(232,163,61,0.55)" }}
      className="glass-panel flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-amber/15 p-3 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-amber">[{citation.index}]</span>
        <span className="font-mono text-[10px] text-ash">{citation.arxivId}</span>
      </div>
      <p className="font-display text-sm leading-snug text-paper line-clamp-3">{citation.title}</p>
      <p className="text-xs text-ash">
        {authorLine}
        {citation.year ? ` · ${citation.year}` : ""}
      </p>
    </motion.a>
  );
}
