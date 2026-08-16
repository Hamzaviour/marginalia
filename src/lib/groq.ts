import type { ArxivPaper } from "@/lib/arxiv";
import type { WebSearchResult } from "./webSearch";

export const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "deepseek-r1-distill-llama-70b",
  "qwen-2.5-72b-instruct",
  "mixtral-8x7b-32768",
] as const;

export type GroqModel = (typeof GROQ_MODELS)[number];

interface CitedPaper {
  arxivId: string;
  title: string;
}

function buildSystemPrompt(
  papers: ArxivPaper[],
  webResults: WebSearchResult[],
  previouslyCitedPapers: CitedPaper[]
): string {
  let sources = "";

  if (papers.length > 0) {
    sources =
      "### CURRENT SOURCES\n\n" +
      papers
        .map(
          (p, i) =>
            `[${i + 1}] "${p.title}" (${p.authors.slice(0, 3).join(", ")}${
              p.authors.length > 3 ? " et al." : ""
            }, ${p.published.slice(0, 4)}) — arXiv:${p.arxivId}\n${p.summary}`
        )
        .join("\n\n");
  }

  if (webResults.length > 0) {
    sources +=
      "\n\n### WEB SOURCES\n\n" +
      webResults
        .map(
          (r, i) =>
            `[WEB-${i + 1}] "${r.title}"\n${r.snippet}\nSource: ${r.url}`
        )
        .join("\n\n");
  }

  const previousContext =
    previouslyCitedPapers.length > 0
      ? `\n\n### PREVIOUSLY CITED PAPERS (maintain consistency with these)\n` +
        previouslyCitedPapers
          .map((p, i) => `[PREV-${i + 1}] "${p.title}" — arXiv:${p.arxivId}`)
          .join("\n")
      : "";

  if (papers.length === 0 && webResults.length === 0) {
    return (
      "You are Marginalia, an AI research assistant. No matching arXiv papers were " +
      "found for this question. Say so plainly, then answer from general knowledge " +
      "if you can, making clear you're not citing a specific paper. Do not hallucinate " +
      "paper titles or sources." +
      previousContext
    );
  }

  return (
    "You are Marginalia, an AI research assistant. Answer the user's question " +
    "using ONLY the sources listed below. Follow these rules strictly:\n\n" +
    "1. Cite every factual claim with the matching bracket number, e.g. [1] or [2][3].\n" +
    "2. Never invent facts, paper titles, authors, or results that are not in the sources.\n" +
    "3. If the sources don't fully answer the question, say exactly what is missing\n" +
    "   and what partial answer you can give from the available papers.\n" +
    "4. Structure your answer: lead with a direct answer, then support each point with citations.\n" +
    "5. Skip introductions, filler, and summarising the papers — only discuss what's relevant.\n" +
    "6. If a user follow-up builds on a previous answer, keep the context consistent and cite again.\n\n" +
    `SOURCES:${previousContext}\n${sources}`
  );
}

export interface GroqChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* streamGroqDeltas(
  apiKey: string,
  model: GroqModel,
  history: GroqChatMessage[],
  papers: ArxivPaper[],
  webResults: WebSearchResult[] = [],
  previouslyCitedPapers: CitedPaper[] = []
): AsyncGenerator<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(papers, webResults, previouslyCitedPapers) },
        ...history,
      ],
      temperature: 0.3,
      max_tokens: 1000,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      if (!payload) continue;

      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Skip malformed chunks
      }
    }
  }
}
