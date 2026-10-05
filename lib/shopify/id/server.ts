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
export function decodeShopifyId(id: string): string {
  if (id.startsWith("gid://")) {
    return id;
  }
  return Buffer.from(id, "base64").toString("utf-8");
}
