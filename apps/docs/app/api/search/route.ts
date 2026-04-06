import { type NextRequest, NextResponse } from "next/server";
import { localSearch } from "fromsrc";
import { docs } from "@/lib/fromsrc/content";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 8), 50);

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  const searchDocs = await docs.getSearchDocs();
  const results = localSearch.search(query, searchDocs, limit);

  return NextResponse.json(
    results.map((r) => ({
      title: r.doc.title,
      description: r.doc.description,
      slug: r.doc.slug,
      snippet: r.snippet,
      anchor: r.anchor,
      heading: r.heading,
      score: r.score,
    })),
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}
