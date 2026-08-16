import { NextResponse } from "next/server";
import { searchWeb } from "@/lib/webSearch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const results = await searchWeb(query, 5);
  return NextResponse.json({ results });
}
