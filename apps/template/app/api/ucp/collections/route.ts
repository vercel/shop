/**
 * UCP Collections Endpoint
 * GET /api/ucp/collections
 */

import { listCollections } from "@/lib/ucp/handlers";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? undefined;

  const collections = await listCollections(locale);

  return Response.json({
    ucp: { version: "2026-01-11", capabilities: ["dev.ucp.shopping.catalog_search"] },
    collections,
  });
}
