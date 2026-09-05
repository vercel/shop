import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { type CommerceLocale, shopConfig } from "@/lib/config";
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
  locale = shopConfig.localization,
}: {
  locale?: CommerceLocale;
} = {}): Promise<ShopAnalyticsData> {
  "use cache";

  cacheLife("max");
  cacheTag("shop-analytics");
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
