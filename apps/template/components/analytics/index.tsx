import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getShopAnalytics } from "@/lib/analytics/server";
import { shopConfig } from "@/lib/config";

import { ShopifyScriptsTracker } from "./shopify-client";

export async function AnalyticsComponents() {
  const useShopifyScripts =
    shopConfig.analytics.shopify.isEnabled ||
    shopConfig.analytics.shopify.consent.isEnabled ||
    shopConfig.browserAgents.webmcp.isEnabled;

  return (
    <>
      {shopConfig.analytics.vercel.isEnabled && <Analytics />}
      {shopConfig.analytics.speedInsights.isEnabled && <SpeedInsights />}
      {useShopifyScripts && (
        <ShopifyScriptsTracker
          shop={await getShopAnalytics({})}
          storefrontId={process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID ?? ""}
        />
      )}
    </>
  );
}
