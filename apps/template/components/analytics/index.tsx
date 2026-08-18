import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { shopConfig } from "@/lib/config";
import { getShopAnalytics } from "@/lib/shopify/operations/shop";

import { ShopifyScriptsTracker } from "./shopify-client";

export async function AnalyticsComponents({ locale }: { locale: string }) {
  return (
    <>
      {shopConfig.analytics.vercel.isEnabled && <Analytics />}
      {shopConfig.analytics.speedInsights.isEnabled && <SpeedInsights />}
      <ShopifyScriptsTracker shop={await getShopAnalytics({ locale })} />
    </>
  );
}
