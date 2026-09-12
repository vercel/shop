import { cacheLife, cacheTag } from "next/cache";

import type { ShopAnalyticsData } from "@/lib/analytics/types";
import type { CommerceLocale } from "@/lib/config/types";
import { fetchShopAnalytics } from "@/lib/shopify/operations/shop/server";

export async function getShopAnalytics(
  params: { locale?: CommerceLocale } = {},
): Promise<ShopAnalyticsData> {
  "use cache";
  cacheLife("max");
  cacheTag("shop-analytics");

  return fetchShopAnalytics(params);
}
