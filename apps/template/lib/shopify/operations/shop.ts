import { gql, type I18nConfig } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ShopAnalyticsData } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

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

export async function getShopAnalytics({
  locale = defaultLocale,
}: { locale?: string } = {}): Promise<ShopAnalyticsData> {
  "use cache";
  cacheLife("max");
  cacheTag("shop-analytics");

  const response = await storefront.request(GET_SHOP_ANALYTICS_QUERY, { locale });
  assertStorefrontOk(response, "getShopAnalytics");

  return {
    acceptedLanguage: getLanguageCode(locale) as I18nConfig["language"],
    country: getCountryCode(locale) as I18nConfig["country"],
    currency: response.data.localization.country.currency.isoCode,
    shopId: response.data.shop.id,
    storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string,
  };
}
