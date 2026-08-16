"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StreamingCursor from "./StreamingCursor";
import CitationCard, { Citation } from "./CitationCard";
import BookmarkButton from "./BookmarkButton";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
}

function extractCitations(content: string): { text: string; links: { match: string; index: number; href: string }[] }[] {
  const parts: { text: string; links: { match: string; index: number; href: string }[] }[] = [];
  const regex = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) {
      parts.push({ text: content.slice(last, m.index), links: [] });
    }
    parts.push({ text: m[0], links: [{ match: m[0], index: parseInt(m[1], 10), href: `#` }] });
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    parts.push({ text: content.slice(last), links: [] });
  }
  return parts.length ? parts : [{ text: content, links: [] }];
}

export default function ChatBubble({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const citationMap = new Map(message.citations?.map((c) => [c.index, c]));
  const parts = extractCitations(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex w-full flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
    >
      <div className="relative flex max-w-[75ch] flex-col gap-1 rounded-2xl px-4 py-3 text-[15px] leading-relaxed">
        <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? "bg-amber/90 text-ink"
            : "glass-panel border border-amber/10 text-paper"
        }`}>
          <span className="whitespace-pre-wrap">
            {parts.map((part, i) =>
              part.links.length > 0
                ? part.links.map((link) => {
                    const cit = citationMap.get(link.index);
                    return cit ? (
                      <a
                        key={i}
                        href={cit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline rounded bg-amber/20 px-1 text-amber hover:bg-amber/30"
                      >
                        {link.match}
                      </a>
                    ) : (
                      <span key={i} className="inline rounded bg-amber/20 px-1 text-amber">
                        {link.match}
                      </span>
                    );
                  })
                : part.text
            )}
          </span>
          {message.streaming && <StreamingCursor />}
        </div>
        {!isUser && (
          <div className="absolute -right-2 -top-2 flex gap-1">
            <button
              onClick={handleCopy}
              className="rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] text-ash hover:text-paper"
              title="Copy"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {!isUser && message.citations && message.citations.length > 0 && (
        <div className="flex w-full flex-wrap gap-3 overflow-x-auto pb-1 pl-1">
          {message.citations.map((c) => (
            <div key={c.index} className="flex w-56 flex-col gap-1">
              <CitationCard citation={c} />
              <BookmarkButton citation={c} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
