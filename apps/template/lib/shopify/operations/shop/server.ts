import { gql, type I18nConfig } from "@shopify/hydrogen";

import type { ShopAnalyticsData } from "@/lib/analytics/types";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

const GET_SHOP_ANALYTICS_QUERY = gql(`#graphql
  query getShopAnalytics($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    localization {
      country {
        currency {
          isoCode
        }
      }
    }
    shop {
      id
    }
  }
`);

export async function fetchShopAnalytics({
  locale = defaultLocale,
}: {
  locale?: ShopifyLocale;
} = {}): Promise<ShopAnalyticsData> {
  const response = await storefront.request(GET_SHOP_ANALYTICS_QUERY, { locale });
  assertStorefrontOk(response, "getShopAnalytics");
  return {
    acceptedLanguage:
      typeof locale === "string"
        ? (getLanguageCode(locale) as I18nConfig["language"])
        : locale.language,
    country:
      typeof locale === "string"
        ? (getCountryCode(locale) as I18nConfig["country"])
        : locale.country,
    currency: response.data.localization.country.currency.isoCode,
    shopId: response.data.shop.id,
    storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string,
  };
}
