import type { NextRequest, ProxyConfig } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale } from "@/lib/i18n";
import { getProductUrl } from "@/lib/product-url";
import { getProductVariantRouteSelection } from "@/lib/shopify/operations/product-variant-route";

function toSearchParamsRecord(searchParams: URLSearchParams): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};

  for (const [name, value] of searchParams) {
    const existing = values[name];
    if (existing === undefined) {
      values[name] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      values[name] = [existing, value];
    }
  }

  return values;
}

export async function proxy(request: NextRequest) {
  const variantId = request.nextUrl.searchParams.get("variant");
  if (!variantId) return NextResponse.next();

  const routeSelection = await getProductVariantRouteSelection({
    variantId,
    locale: defaultLocale,
  });
  if (!routeSelection) return NextResponse.next();

  const destination = request.nextUrl.clone();
  const normalizedPath = getProductUrl(
    routeSelection.handle,
    routeSelection.selectedOptions,
    toSearchParamsRecord(request.nextUrl.searchParams),
  );
  const normalizedUrl = new URL(normalizedPath, destination);

  return NextResponse.redirect(normalizedUrl, 308);
}

export const config: ProxyConfig = {
  matcher: [
    {
      source: "/products/:path*",
      has: [{ type: "query", key: "variant" }],
    },
  ],
};
