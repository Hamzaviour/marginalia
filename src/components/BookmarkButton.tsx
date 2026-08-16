"use client";

import { useState } from "react";
import { Citation } from "./CitationCard";

interface Props {
  citation: Citation;
}

export default function BookmarkButton({ citation }: Props) {
  const [saved, setSaved] = useState(false);

  async function handleBookmark() {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arxivId: citation.arxivId,
        title: citation.title,
        authors: citation.authors.join(", "),
        url: citation.url,
        year: citation.year,
      }),
    });
    setSaved(true);
  }

  if (saved) {
    return <span className="text-xs text-amber">Saved</span>;
  }

  return (
    <button
      onClick={handleBookmark}
      className="text-xs text-ash hover:text-amber"
      title="Bookmark this paper"
    >
      Bookmark
    </button>
  );
}
