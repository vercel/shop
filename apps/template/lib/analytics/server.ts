import { cacheLife, cacheTag } from "next/cache";

import type { ShopAnalyticsData } from "@/lib/analytics/types";
import { fetchShopAnalytics } from "@/lib/shopify/operations/shop/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

export async function getShopAnalytics(
  params: { locale?: ShopifyLocale } = {},
): Promise<ShopAnalyticsData> {
  "use cache";
  cacheLife("max");
  cacheTag("shop-analytics");

  return fetchShopAnalytics(params);
}
