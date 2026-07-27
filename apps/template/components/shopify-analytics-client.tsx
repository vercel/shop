"use client";

import { useShopifyPageView } from "@/lib/analytics/client";
import type { ShopAnalyticsData } from "@/lib/types";

interface ShopifyAnalyticsTrackerProps {
  shop: ShopAnalyticsData;
}

export function ShopifyAnalyticsTracker({ shop }: ShopifyAnalyticsTrackerProps) {
  useShopifyPageView(shop);

  return null;
}
