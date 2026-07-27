import { isShopifyAnalyticsEnabled } from "@/lib/analytics";
import { getShopAnalytics } from "@/lib/shopify/operations/shop";

import { ShopifyAnalyticsTracker } from "./shopify-analytics-client";

export async function ShopifyAnalytics({ locale }: { locale: string }) {
  if (!isShopifyAnalyticsEnabled) return null;

  const shop = await getShopAnalytics({ locale });

  return <ShopifyAnalyticsTracker shop={shop} />;
}
