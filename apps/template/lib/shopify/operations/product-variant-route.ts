import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { SelectedOption } from "@/lib/types";

import { shopifyFetch } from "../fetch";

const GET_PRODUCT_VARIANT_ROUTE_SELECTION_QUERY = `
  query getProductVariantRouteSelection($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    node(id: $id) {
      ... on ProductVariant {
        product {
          handle
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

export async function getProductVariantRouteSelection({
  variantId,
  locale = defaultLocale,
}: {
  variantId: string;
  locale?: string;
}): Promise<{ handle: string; selectedOptions: SelectedOption[] } | undefined> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const id = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  const data = await shopifyFetch<{
    node: {
      product: { handle: string };
      selectedOptions: SelectedOption[];
    } | null;
  }>({
    cache: "no-store",
    operation: "getProductVariantRouteSelection",
    query: GET_PRODUCT_VARIANT_ROUTE_SELECTION_QUERY,
    variables: { id, country, language },
  });

  if (!data.node) return undefined;

  return {
    handle: data.node.product.handle,
    selectedOptions: data.node.selectedOptions,
  };
}
