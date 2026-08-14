import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { shopConfig } from "@/lib/config";
import { getShopAnalytics } from "@/lib/shopify/operations/shop";

import { ShopifyScriptsTracker } from "./shopify-client";

export async function AnalyticsComponents({ locale }: { locale: string }) {
  const shopifyScriptsEnabled =
    shopConfig.analytics.shopify.isEnabled || shopConfig.webmcp.isEnabled;

  return (
    <>
      {shopConfig.analytics.vercel.isEnabled && <Analytics />}
      {shopConfig.analytics.speedInsights.isEnabled && <SpeedInsights />}
      {shopifyScriptsEnabled && (
        <ShopifyScriptsTracker shop={await getShopAnalytics({ locale })} />
      )}
    </>
  );
}
