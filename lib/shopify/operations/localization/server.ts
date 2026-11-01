import { gql } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";

const GET_LOCALIZATION_CURRENCY_QUERY = gql(`#graphql
  query getLocalizationCurrency($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    localization {
      country {
        currency {
          isoCode
        }
      }
    }
  }
`);

export async function fetchLocalizationCurrency({
  locale = shopConfig.localization,
}: {
  locale?: CommerceLocale;
} = {}): Promise<string> {
  const response = await storefront.request(GET_LOCALIZATION_CURRENCY_QUERY, { locale });
  assertStorefrontOk(response, "getLocalizationCurrency");
  return response.data.localization.country.currency.isoCode;
}
