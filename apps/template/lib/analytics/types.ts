import type { I18nConfig } from "@shopify/hydrogen";

export interface ShopAnalyticsData {
  acceptedLanguage: I18nConfig["language"];
  country: I18nConfig["country"];
  currency: string;
  shopId: string;
  storeDomain: string;
}
