import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchArxiv } from "@/lib/arxiv";
import { rerankBySemanticScore, extractQueryTerms } from "@/lib/semanticSearch";
import { searchWeb, formatWebSources } from "@/lib/webSearch";
import { streamGroqDeltas, GROQ_MODELS } from "@/lib/groq";

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  groqApiKey: z.string().min(1, "Add your Groq API key in the sidebar first"),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { sessionId, message, groqApiKey, model } = parsed.data;

  const chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.message.create({
    data: { sessionId, role: "user", content: message },
  });

  // Search arXiv and rerank by semantic score
  let papers = await searchArxiv(message, 5).catch(() => [] as any[]);
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
  const history = priorMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

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

  const selectedModel = model && GROQ_MODELS.includes(model) ? model : GROQ_MODELS[0];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "citations", citations });

      let fullText = "";
      try {
        for await (const delta of streamGroqDeltas(groqApiKey, history, papers, webResults)) {
          fullText += delta;
          send({ type: "delta", text: delta });
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", error: `Groq request failed — ${detail}` });
        controller.close();
        return;
      }

      if (!fullText.trim()) {
        send({ type: "error", error: "Groq returned an empty response." });
        controller.close();
        return;
      }

      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullText,
          citations: JSON.stringify(citations),
        },
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: isNewThread ? { title: newTitle, updatedAt: new Date() } : { updatedAt: new Date() },
      });

      send({
        type: "done",
        messageId: fullText,
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
