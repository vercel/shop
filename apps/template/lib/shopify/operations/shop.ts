export async function getShopDefaultCurrencyCode(): Promise<string> {
  return process.env.SHOPIFY_DEFAULT_CURRENCY ?? "USD";
}
