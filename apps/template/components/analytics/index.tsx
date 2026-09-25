import type { ShopifyScriptsI18n, ShopifyScriptsShop } from "@shopify/hydrogen";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { isShopifyScriptsEnabled, shopConfig, SHOPIFY_SHOP_ID } from "@/lib/config";

import { ShopifyScriptsTracker } from "./shopify-client";

export function AnalyticsComponents() {
  const i18n: ShopifyScriptsI18n = {
    country: shopConfig.localization.country,
    language: shopConfig.localization.language,
  };
  const shop: ShopifyScriptsShop = {
    myshopifyDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string,
    shopId: SHOPIFY_SHOP_ID,
    storefrontId: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID ?? "",
  };

  return (
    <>
      {shopConfig.analytics.vercel.isEnabled && <Analytics />}
      {shopConfig.analytics.speedInsights.isEnabled && <SpeedInsights />}
      {isShopifyScriptsEnabled && <ShopifyScriptsTracker i18n={i18n} shop={shop} />}
    </>
  );
}
