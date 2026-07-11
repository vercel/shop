export type ShopifyEdges<T> = { edges: Array<{ node: T }> };

export function flattenEdges<T>(connection: ShopifyEdges<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

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
    path = path.replace(/^\/[a-z]{2}(-[a-z]{2,4})?\//i, "/");

    return path;
  } catch {
    return url;
  }
}
