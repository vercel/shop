import {
  AnalyticsEvent,
  createStorefrontAnalytics,
  type ShopAnalytics,
  type StorefrontAnalytics,
} from "@shopify/hydrogen";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ShopAnalyticsData } from "@/lib/types";
import { shopConfig } from "@/shop.config";

export { AnalyticsEvent };

export const isShopifyAnalyticsEnabled = shopConfig.analytics.shopify.enabled;

// The CDN script requires shop.channel to be exactly "hydrogen" or "headless";
// hydrogenSubchannelId is forwarded to monorail, not used for channel.
type AnalyticsBusShop = ShopAnalytics & { channel: "headless" };

let bus: StorefrontAnalytics | null = null;
let analyticsShop: AnalyticsBusShop | null = null;
let analyticsShopData: ShopAnalyticsData | null = null;

export function configureAnalytics(shop: ShopAnalyticsData): void {
  analyticsShopData = shop;
  analyticsShop = { ...shop, channel: "headless", hydrogenSubchannelId: "0" };
}

export function getAnalytics(): StorefrontAnalytics | null {
  // Module-scope construction would run during SSR and crash on browser globals.
  if (typeof window === "undefined") return null;
  if (!isShopifyAnalyticsEnabled || !analyticsShop || !analyticsShopData) return null;

  // The CDN script reads a Liquid-injected window.Shopify config, so seed it
  // before the bus loads that script. The consent banner supplies customerPrivacy.
  const shopifyWindow = window as unknown as {
    Shopify?: {
      country?: string;
      currency?: { active?: string };
      locale?: string;
    };
  };
  const shopifyGlobal = (shopifyWindow.Shopify ??= {});
  shopifyGlobal.country ??= getCountryCode(defaultLocale);
  shopifyGlobal.locale ??= getLanguageCode(defaultLocale).toLowerCase();
  shopifyGlobal.currency ??= {};
  shopifyGlobal.currency.active ??= analyticsShopData.currency;

  bus ??= createStorefrontAnalytics({
    canTrack: () => true,
    consent: {
      consentDomain: typeof window === "undefined" ? undefined : window.location.host,
      mode: shopConfig.analytics.shopify.consentMode,
    },
    shop: analyticsShop,
  });

  return bus;
}
