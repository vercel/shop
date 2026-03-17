import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { PredictiveSearchResult } from "@/lib/types";

import { shopifyFetch } from "../client";
import { IMAGE_FRAGMENT, MONEY_FRAGMENT } from "../fragments";
import {
  type ShopifyPredictiveSearchResult,
  transformPredictiveSearchResult,
} from "../transforms/search";

const PREDICTIVE_SEARCH_QUERY = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  query predictiveSearch($query: String!, $limit: Int!, $limitScope: PredictiveSearchLimitScope, $types: [PredictiveSearchType!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $query
      limit: $limit
      limitScope: $limitScope
      types: $types
    ) {
      products {
        id
        title
        handle
        vendor
        availableForSale
        featuredImage {
          ...ImageFields
        }
        priceRange {
          minVariantPrice {
            ...MoneyFields
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            ...MoneyFields
          }
        }
      }
      collections {
        handle
        title
      }
      queries {
        text
        styledText
      }
    }
  }
`;

export async function predictiveSearch(
  query: string,
  locale: string = defaultLocale,
  limit = 4,
): Promise<PredictiveSearchResult> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    predictiveSearch: ShopifyPredictiveSearchResult;
  }>({
    operation: "predictiveSearch",
    query: PREDICTIVE_SEARCH_QUERY,
    variables: {
      query,
      limit,
      limitScope: "EACH",
      types: ["PRODUCT", "COLLECTION", "QUERY"],
      country,
      language,
    },
  });

  if (!data.predictiveSearch) {
    return { products: [], collections: [], queries: [] };
  }

  return transformPredictiveSearchResult(data.predictiveSearch);
}
