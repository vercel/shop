import { gql } from "@shopify/hydrogen";

import { BUNDLE_RELATIONSHIPS_FRAGMENT } from "@/lib/shopify/fragments/bundle";

// Money and Image selections are inlined so diamond-shaped fragment composition never emits one leaf fragment twice.

export const PRODUCT_VARIANT_FRAGMENT = gql(
  `#graphql
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    price {
      amount
        currencyCode
    }
    compareAtPrice {
      amount
        currencyCode
    }
    selectedOptions {
      name
      value
    }
    image {
      url
        altText
        width
        height
    }
    product {
      handle
      title
    }
  }
`,
);
export const PURCHASABLE_PRODUCT_VARIANT_FRAGMENT = gql(
  `#graphql
  fragment PurchasableProductVariantFields on ProductVariant {
    ...BundleRelationshipFields
    ...ProductVariantFields
  }
`,
  [BUNDLE_RELATIONSHIPS_FRAGMENT, PRODUCT_VARIANT_FRAGMENT],
);
