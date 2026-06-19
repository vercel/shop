import { getNumericShopifyId } from "@/lib/shopify/utils";

export function getProductVariantUrl(
  handle: string,
  variantId: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): string {
  const params = new URLSearchParams();
  const numericVariantId = /^\d+$/.test(variantId) ? variantId : getNumericShopifyId(variantId);
  if (!numericVariantId || !/^\d+$/.test(numericVariantId)) {
    throw new Error(`Invalid Shopify product variant ID: ${variantId}`);
  }

  params.set("variant", numericVariantId);

  for (const [name, rawValue] of Object.entries(searchParams)) {
    if (name.toLowerCase() === "variant") continue;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value) params.append(name, value);
    }
  }

  const query = params.toString();
  return `/products/${handle}?${query}`;
}
