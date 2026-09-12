import { gql } from "@shopify/hydrogen";

import type { ShopAnalyticsData } from "@/lib/analytics/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";

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
  locale = shopConfig.localization,
}: {
  locale?: CommerceLocale;
} = {}): Promise<ShopAnalyticsData> {
  const response = await storefront.request(GET_SHOP_ANALYTICS_QUERY, { locale });
  assertStorefrontOk(response, "getShopAnalytics");
  return {
    acceptedLanguage: locale.language,
    country: locale.country,
    currency: response.data.localization.country.currency.isoCode,
    shopId: response.data.shop.id,
    storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string,
  };
}
