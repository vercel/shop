/**
 * UCP Catalog Search Endpoint
 * GET /api/ucp/products?q=...&limit=...&sort=...
 */

import { searchCatalog } from "@/lib/ucp/handlers";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  const sort = url.searchParams.get("sort") ?? "best-matches";
  const locale = url.searchParams.get("locale") ?? undefined;

  if (!query) {
    return Response.json({ error: { code: "missing_query", message: "Query parameter 'q' is required" } }, { status: 400 });
  }

  const result = await searchCatalog({ query, limit, sort, locale });

  return Response.json({
    ucp: { version: "2026-01-11", capabilities: ["dev.ucp.shopping.catalog_search"] },
    ...result,
  });
}
