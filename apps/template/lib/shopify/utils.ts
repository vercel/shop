export type ShopifyEdges<T> = { edges: Array<{ node: T }> };

export function flattenEdges<T>(connection: ShopifyEdges<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

/** "gid://shopify/Product/1234567890" → "1234567890". Accepts raw or base64-encoded GIDs. */
export function getNumericShopifyId(gid: string): string | null {
  let decoded = gid;

  if (!decoded.startsWith("gid://")) {
    try {
      decoded = Buffer.from(decoded, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }

  const match = decoded.match(/gid:\/\/shopify\/\w+\/(\d+)/);
  return match?.[1] ?? null;
}

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";

/**
 * Transform a Shopify menu item URL into a locale-independent internal path
 * or pass through external URLs as-is.
 *
 * - Strips the store domain, returning path only (e.g. `/collections/electronics`)
 * - Maps `products/handle` → `product/handle` (app uses singular)
 * - Maps FRONTPAGE → `/`, SEARCH → `/search`
 * - External URLs (different domain) pass through unchanged
 * - Internal paths are used directly (no locale prefix)
 */
export function transformShopifyMenuItemUrl(
  url: string | null,
  type: import("./types/menu").MenuItemType,
): string {
  if (type === "FRONTPAGE") return "/";
  if (type === "SEARCH") return "/search";

  if (!url) return "/";

  try {
    const parsed = new URL(url);
    const isInternal =
      SHOPIFY_STORE_DOMAIN &&
      parsed.hostname === new URL(`https://${SHOPIFY_STORE_DOMAIN}`).hostname;

    if (!isInternal) return url;

    let path = parsed.pathname;
    // Strip Shopify Markets locale prefix (e.g. /nl/, /fr/, /pt-br/)
    path = path.replace(/^\/[a-z]{2}(-[a-z]{2,4})?\//i, "/");

    return path;
  } catch {
    // Not a valid URL — treat as a relative path
    return url;
  }
}
