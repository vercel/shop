import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { isShopifyAnalyticsEnabled } from "@/lib/analytics";
import { getShopAnalytics } from "@/lib/shopify/operations/shop";
import { shopConfig } from "@/shop.config";

import { ShopifyAnalyticsTracker } from "./shopify-analytics-client";

export async function AnalyticsComponents({ locale }: { locale: string }) {
  return (
    <>
      {shopConfig.analytics.vercel.enabled ? <Analytics /> : null}
      {shopConfig.analytics.speedInsights.enabled ? <SpeedInsights /> : null}
      {isShopifyAnalyticsEnabled ? (
        <ShopifyAnalyticsTracker shop={await getShopAnalytics({ locale })} />
      ) : null}
    </>
  );
}
