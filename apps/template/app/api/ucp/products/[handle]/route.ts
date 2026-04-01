/**
 * UCP Catalog Lookup Endpoint
 * GET /api/ucp/products/:handle
 */

import { lookupProduct } from "@/lib/ucp/handlers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<Response> {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? undefined;

  const product = await lookupProduct(handle, locale);

  if (!product) {
    return Response.json(
      { error: { code: "not_found", message: `Product '${handle}' not found` } },
      { status: 404 },
    );
  }

  return Response.json({
    ucp: { version: "2026-01-11", capabilities: ["dev.ucp.shopping.catalog_lookup"] },
    product,
  });
}
