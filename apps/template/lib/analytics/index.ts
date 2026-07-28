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

let bus: StorefrontAnalytics | null = null;
let analyticsShop: ShopAnalytics | null = null;
let analyticsShopData: ShopAnalyticsData | null = null;

export function configureAnalytics(shop: ShopAnalyticsData): void {
  analyticsShopData = shop;
  analyticsShop = { ...shop, hydrogenSubchannelId: "0" };
}

// Constructing at module scope would run during SSR and crash on browser globals.
export function getAnalytics(): StorefrontAnalytics | null {
  if (typeof window === "undefined") return null;
  if (!isShopifyAnalyticsEnabled || !analyticsShop || !analyticsShopData) return null;

  // The CDN analytics script expects a Liquid-injected window.Shopify config; seed it
  // (country, locale, currency.active, shop) before the bus loads that script.
  const shopifyWindow = window as unknown as {
    Shopify?: {
      country?: string;
      currency?: { active?: string };
      locale?: string;
      shop?: {
        channel?: string;
        domain?: string;
      };
    };
  };
  const shopifyGlobal = (shopifyWindow.Shopify ??= {});
  shopifyGlobal.country ??= getCountryCode(defaultLocale);
  shopifyGlobal.locale ??= getLanguageCode(defaultLocale).toLowerCase();
  shopifyGlobal.currency ??= {};
  shopifyGlobal.currency.active ??= analyticsShopData.currency;
  shopifyGlobal.shop ??= {};
  shopifyGlobal.shop.channel ??= "hydrogen";
  shopifyGlobal.shop.domain ??= analyticsShopData.shopDomain;

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
