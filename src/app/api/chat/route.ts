import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchArxiv } from "@/lib/arxiv";
import { rerankBySemanticScore, extractQueryTerms } from "@/lib/semanticSearch";
import { searchWeb, formatWebSources } from "@/lib/webSearch";
import { streamUnifiedChat, PROVIDERS, DEFAULT_PROVIDER, type ProviderId } from "@/lib/unifiedChat";

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  provider: z.enum(PROVIDERS.map((p) => p.id) as [ProviderId, ...ProviderId[]]).default(DEFAULT_PROVIDER),
  apiKey: z.string().min(1, "Add your API key in the sidebar first"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { sessionId, message, provider, apiKey } = parsed.data;

  const chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.message.create({
    data: { sessionId, role: "user", content: message },
  });

  // Extract keywords for arXiv search (strip stop words like "what", "is", "a")
  const searchTerms = extractQueryTerms(message);
  const arxivQuery = searchTerms.length > 0 ? searchTerms.join(" ") : message;

  // Search arXiv and rerank by semantic score
  let papers = await searchArxiv(arxivQuery, 5).catch(() => [] as any[]);
  if (papers.length > 0) {
    papers = rerankBySemanticScore(papers, message);
  }

  // Web search fallback if arXiv returns poor results
  let webResults: any[] = [];
  if (papers.length < 2) {
    webResults = await searchWeb(message, 5).catch(() => []);
  }

  // Get conversation history
  const priorMessages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const history = priorMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Get previously cited papers for context
  const assistantMessages = priorMessages.filter((m) => m.role === "assistant");
  const citedPapers = assistantMessages
    .flatMap((m) => m.citations ? JSON.parse(m.citations) : [])
    .filter((c: any, idx: number, arr: any[]) => arr.findIndex((x) => x.arxivId === c.arxivId) === idx)
    .slice(-3);

  const citations = papers.map((p: any, i: number) => ({
    index: i + 1,
    title: p.title,
    authors: p.authors,
    arxivId: p.arxivId,
    url: p.url,
    year: p.published.slice(0, 4),
  }));

  const isNewThread = chatSession.title === "New research thread";
  const newTitle = message.slice(0, 60);
  const encoder = new TextEncoder();

  // Update session search text
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { searchText: message.toLowerCase().slice(0, 500) },
  });

  // Gather previously cited papers for context consistency
  const previouslyCitedPapers = assistantMessages
    .map((m) => m.citations ? JSON.parse(m.citations) : [])
    .flat()
    .filter((c: any, idx: number, arr: any[]) => arr.findIndex((x) => x.arxivId === c.arxivId) === idx)
    .slice(-3);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "citations", citations });

      let fullText = "";
      let assistantMessageId = "";
      try {
        const result = await streamUnifiedChat({
          providerId: provider,
          apiKey,
          history,
          papers,
          webResults,
          previouslyCitedPapers,
        });
        fullText = result.text;
        for (const char of fullText) {
          send({ type: "delta", text: char });
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", error: `${provider} request failed — ${detail}` });
        controller.close();
        return;
      }

      if (fullText.trim().length === 0) {
        send({ type: "error", error: "The model returned an empty response. This can happen if: (1) your API key is invalid, (2) the model has safety filters, or (3) the prompt is too long. Try using a different provider or shortening your message." });
        controller.close();
        return;
      }

      const created = await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullText,
          citations: JSON.stringify(citations),
        },
      });
      assistantMessageId = created.id;

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: isNewThread ? { title: newTitle, updatedAt: new Date() } : { updatedAt: new Date() },
      });

      send({
        type: "done",
        messageId: assistantMessageId,
        sessionTitle: isNewThread ? newTitle : chatSession.title,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
