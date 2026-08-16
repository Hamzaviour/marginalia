import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.arxivId || !body?.title || !body?.url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.user.id,
      arxivId: body.arxivId,
      title: body.title,
      authors: body.authors ?? "",
      url: body.url,
      year: body.year,
    },
  });

  return NextResponse.json({ bookmark });
}
