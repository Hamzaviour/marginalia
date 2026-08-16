import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(sessionId: string, userId: string) {
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chatSession || chatSession.userId !== userId) return null;
  return chatSession;
}

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chatSession = await assertOwnership(params.sessionId, session.user.id);
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const md = chatSession.messages
    .map((m) => {
      const role = m.role === "user" ? "**You:**" : "**Marginalia:**";
      return `${role}\n\n${m.content}`;
    })
    .join("\n\n---\n\n");

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${chatSession.title.replace(/[^a-z0-9]/gi, "_")}.md"`,
    },
  });
}
