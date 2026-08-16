import {
  ProviderId,
  ProviderInfo,
  PROVIDERS,
  DEFAULT_PROVIDER,
} from "./providers";
import type { ArxivPaper } from "./arxiv";
import type { WebSearchResult } from "./webSearch";

interface CitedPaper {
  arxivId: string;
  title: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
      ? `\n\n### PREVIOUSLY CITED PAPERS (for context continuity only — do NOT use these to answer unrelated questions)\n` +
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
    "You are Marginalia, an AI research assistant. Your PRIMARY goal is to answer " +
    "the user's ACTUAL question. Follow these rules strictly:\n\n" +
    "1. FIRST, determine if the provided sources are relevant to the user's question.\n" +
    "2. If the sources ARE relevant, use them to answer and cite every factual claim " +
    "with the matching bracket number, e.g. [1] or [2][3].\n" +
    "3. If the sources are NOT relevant to the user's question, explicitly state that " +
    "no relevant papers were found, then answer from your general knowledge. " +
    "Make clear when you are answering from general knowledge vs. citing a source.\n" +
    "4. Never invent facts, paper titles, authors, or results that are not in the sources.\n" +
    "5. Structure your answer: lead with a direct answer to the question asked, " +
    "then support each point with citations where applicable.\n" +
    "6. Skip introductions, filler, and summarising unrelated papers.\n" +
    "7. PREVIOUSLY CITED PAPERS ([PREV-N]) are for maintaining context continuity " +
    "in follow-up questions ONLY. Do NOT use them to answer unrelated new questions.\n\n" +
    `SOURCES:${previousContext}\n${sources}`
  );
}


function getProvider(id: string): ProviderInfo {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}

const AUTO_MODEL_DEFAULTS: Partial<Record<ProviderId, string>> = {
  groq: 'openai/gpt-oss-20b',
};

function resolveModel(provider: ProviderInfo, model?: string): string {
  const selected = provider.autoSelectModel ? provider.models[0] : (model ?? provider.models[0]);
  if (selected === 'auto' && AUTO_MODEL_DEFAULTS[provider.id]) {
    return AUTO_MODEL_DEFAULTS[provider.id]!;
  }
  return selected;
}

interface OpenAICompatibleStreamResult {
  text: string;
  deltaCount: number;
}

async function streamOpenAICompatible(
  provider: ProviderInfo,
  apiKey: string,
  model: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<OpenAICompatibleStreamResult> {
  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${provider.authHeader} ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      temperature: 0.3,
      max_tokens: 1000,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`${provider.name} API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let deltaCount = 0;
  const chunks: Buffer[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") break;
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) {
          deltaCount++;
          text += delta;
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  console.log(`${provider.name} stream result: ${text.length} chars, ${deltaCount} deltas`);
  if (deltaCount === 0 && text.length === 0) {
    const rawResponse = Buffer.concat(chunks).toString('utf-8');
    console.error(`${provider.name} EMPTY response raw: ${rawResponse.slice(0, 500)}`);
    // Check if response contains finish_reason with content_filter
    if (rawResponse.includes('content_filter')) {
      throw new Error(`${provider.name} response was filtered by content safety settings. Try rephrasing your question.`);
    }
    // Check for model deprecation or not-found errors
    if (rawResponse.includes('model_not_found') || rawResponse.includes('decommissioned') || rawResponse.includes('does not exist') || rawResponse.includes('model_not_active')) {
      throw new Error(`The selected model is no longer available on ${provider.name}. Please select a different model.`);
    }
    throw new Error(`${provider.name} returned an empty response. Raw: ${rawResponse.slice(0, 200)}. Check your API key at ${provider.apiKeyDocs}`);
  }
  return { text, deltaCount };
}

interface AnthropicStreamResult {
  text: string;
  deltaCount: number;
}

async function streamAnthropic(
  provider: ProviderInfo,
  apiKey: string,
  model: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<AnthropicStreamResult> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = history.map(
    (m) => ({ role: m.role, content: m.content })
  );

  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`${provider.name} API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let deltaCount = 0;
  const chunks: Buffer[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === "content_block_delta") {
          const deltaText: string | undefined = json.delta?.text;
          if (deltaText) {
            deltaCount++;
            text += deltaText;
          }
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  console.log(`${provider.name} stream result: ${text.length} chars, ${deltaCount} deltas`);
  if (deltaCount === 0 && text.length === 0) {
    console.error(`${provider.name} returned EMPTY response`);
    throw new Error(`${provider.name} returned an empty response. This usually means: (1) your API key is invalid or expired, (2) the model is rate-limited, or (3) the prompt triggered a safety filter. Check your API key and try a different model.`);
  }
  return { text, deltaCount };
}

export interface UnifiedChatResult {
  text: string;
  deltaCount: number;
}

export interface UnifiedChatOptions {
  providerId: ProviderId;
  apiKey: string;
  model?: string;
  history: ChatMessage[];
  papers: ArxivPaper[];
  webResults?: WebSearchResult[];
  previouslyCitedPapers?: CitedPaper[];
}

export async function streamUnifiedChat(
  options: UnifiedChatOptions
): Promise<UnifiedChatResult> {
  const {
    providerId,
    apiKey,
    model,
    history,
    papers,
    webResults = [],
    previouslyCitedPapers = [],
  } = options;

  const provider = getProvider(providerId);
  const resolvedModel = resolveModel(provider, model);
  const systemPrompt = buildSystemPrompt(papers, webResults, previouslyCitedPapers);

  let result: UnifiedChatResult;
  if (provider.format === "anthropic") {
    result = await streamAnthropic(provider, apiKey, resolvedModel, history, systemPrompt);
  } else {
    result = await streamOpenAICompatible(provider, apiKey, resolvedModel, history, systemPrompt);
  }

  // Strip reasoning model <think>...</think> blocks (e.g. Qwen 3.6)
  result.text = result.text.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();

  return result;
}

export { PROVIDERS, DEFAULT_PROVIDER };
export type { ProviderId, ProviderInfo };
