import {
  AnalyticsEvent,
  createStorefrontAnalytics,
  type ShopAnalytics,
  type StorefrontAnalytics,
} from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ShopAnalyticsData } from "@/lib/types";

export { AnalyticsEvent };
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
  if (!shopConfig.analytics.shopify.isEnabled || !analyticsShop || !analyticsShopData) return null;

  // The CDN script reads a Liquid-injected window.Shopify config, so seed it
  // before the bus loads that script. The consent banner supplies customerPrivacy.
  const shopifyWindow = window as unknown as {
    Shopify?: {
      country?: string;
      currency?: { active?: string };
      customerPrivacy?: { analyticsProcessingAllowed?: () => boolean };
      locale?: string;
    };
  };
  const shopifyGlobal = (shopifyWindow.Shopify ??= {});
  shopifyGlobal.country ??= getCountryCode(defaultLocale);
  shopifyGlobal.locale ??= getLanguageCode(defaultLocale).toLowerCase();
  shopifyGlobal.currency ??= {};
  shopifyGlobal.currency.active ??= analyticsShopData.currency;

  bus ??= createStorefrontAnalytics({
    // Gate delivery on the consent API: customerPrivacy only gains
    // analyticsProcessingAllowed after the customer-privacy script loads inside
    // initConsent. Blocked events buffer and replay on the consent ready hooks.
    canTrack: () =>
      Boolean(
        shopifyWindow.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.(),
      ),
    consent: {
      // consentDomain must be the shop domain so Hydrogen fetches
      // https://{shop}.myshopify.com/api/unstable/graphql.json instead of the
      // same-origin proxy (which doesn't exist here).
      consentDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
      mode: shopConfig.analytics.shopify.consentMode,
      // Public token is safe in the browser; Hydrogen sends it as the
      // X-Shopify-Storefront-Access-Token header on the consent handshake.
      publicStorefrontAccessToken:
        process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    shop: analyticsShop,
  });

  return bus;
}
