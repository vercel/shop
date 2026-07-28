import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ShopAnalyticsData } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

const GET_SHOP_ANALYTICS_QUERY = `#graphql
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
` as const;

interface ShopAnalyticsResponse {
  localization: {
    country: {
      currency: {
        isoCode: string;
      };
    };
  };
  shop: {
    id: string;
  };
}

export async function getShopAnalytics({
  locale = defaultLocale,
}: { locale?: string } = {}): Promise<ShopAnalyticsData> {
  "use cache";
  cacheLife("max");
  cacheTag("shop-analytics");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const response = await storefront.request<ShopAnalyticsResponse>(GET_SHOP_ANALYTICS_QUERY, {
    variables: { country, language },
  });
  assertStorefrontOk(response, "getShopAnalytics");

  return {
    acceptedLanguage: language,
    currency: response.data.localization.country.currency.isoCode,
    shopId: response.data.shop.id,
  };
}
