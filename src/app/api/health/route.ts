import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedUrl = dbUrl
    ? dbUrl.replace(/:[^:@]+@/, ":****@")
    : "NOT_SET";

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      databaseUrlScheme: dbUrl.split(":")[0] || "none",
      maskedUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "error",
        error: err?.message || String(err),
        databaseUrlScheme: dbUrl.split(":")[0] || "none",
        maskedUrl,
      },
      { status: 500 }
    );
  }
}
