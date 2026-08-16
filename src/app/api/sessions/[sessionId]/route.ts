import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(sessionId: string, userId: string) {
  const chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!chatSession || chatSession.userId !== userId) return null;
  return chatSession;
}

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await assertOwnership(params.sessionId, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { sessionId: params.sessionId },
    orderBy: { createdAt: "asc" },
  });

  const withParsedCitations = messages.map((m) => ({
    ...m,
    citations: m.citations ? JSON.parse(m.citations) : [],
  }));

  return NextResponse.json({ session: owned, messages: withParsedCitations });
}

export async function DELETE(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await assertOwnership(params.sessionId, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.chatSession.delete({ where: { id: params.sessionId } });
  return NextResponse.json({ ok: true });
}
