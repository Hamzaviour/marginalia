"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
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

/**
 * Render inline citation brackets like [1], [2] as clickable links
 * by pre-processing content to convert them into markdown links.
 */
function linkifyCitations(content: string, citationMap: Map<number, Citation>): string {
  return content.replace(/\[(\d+)\]/g, (match, num) => {
    const index = parseInt(num, 10);
    const cit = citationMap.get(index);
    if (cit) {
      return `[${match}](${cit.url})`;
    }
    return match;
  });
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
  const processedContent = isUser
    ? message.content
    : linkifyCitations(message.content, citationMap);

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
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...props }) => (
                    <a
                      {...props}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline rounded bg-amber/20 px-1 text-amber hover:bg-amber/30"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
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

