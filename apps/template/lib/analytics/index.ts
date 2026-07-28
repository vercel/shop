import {
  AnalyticsEvent,
  createStorefrontAnalytics,
  type ShopAnalytics,
  type StorefrontAnalytics,
} from "@shopify/hydrogen";

import type { ShopAnalyticsData } from "@/lib/types";
import { shopConfig } from "@/shop.config";

export { AnalyticsEvent };

export const isShopifyAnalyticsEnabled = shopConfig.analytics.shopify.enabled;

let bus: StorefrontAnalytics | null = null;
let analyticsShop: ShopAnalytics | null = null;

export function configureAnalytics(shop: ShopAnalyticsData): void {
  analyticsShop = { ...shop, hydrogenSubchannelId: "0" };
}

// Constructing at module scope would run during SSR and crash on browser globals.
export function getAnalytics(): StorefrontAnalytics | null {
  if (typeof window === "undefined") return null;
  if (!isShopifyAnalyticsEnabled || !analyticsShop) return null;

  // Same-origin consentDomain makes the browser post the consent handshake to
  // /api/unstable/graphql.json, where the token is injected server-side.
  bus ??= createStorefrontAnalytics({
    consent: {
      consentDomain: typeof window === "undefined" ? undefined : window.location.host,
      mode: shopConfig.analytics.shopify.consentMode,
    },
    shop: analyticsShop,
  });

  return bus;
}
