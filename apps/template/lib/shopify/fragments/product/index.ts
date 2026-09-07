import { gql } from "@shopify/hydrogen";

import { BUNDLE_RELATIONSHIPS_FRAGMENT } from "@/lib/shopify/fragments/bundle";
import { TAXONOMY_CATEGORY_FRAGMENT } from "@/lib/shopify/fragments/taxonomy";
import { PRODUCT_VARIANT_FRAGMENT } from "@/lib/shopify/fragments/variant";

// Money and Image selections are inlined so diamond-shaped fragment composition never emits one leaf fragment twice.

export const PRODUCT_FRAGMENT = gql(
  `#graphql
  fragment ProductFields on Product {
    id
    title
    handle
    description
    descriptionHtml
    vendor
    tags
    updatedAt
    availableForSale
    isGiftCard
    featuredImage {
      url
        altText
        width
        height
    }
    media(first: 10) {
      edges {
        node {
          __typename
          mediaContentType
          ... on MediaImage {
            image {
              url
        altText
        width
        height
            }
          }
          ... on Video {
            previewImage {
              url
        altText
        width
        height
            }
            sources {
              url
              mimeType
              width
              height
            }
          }
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    variantsCount {
      count
    }
    selectedOrFirstAvailableVariant {
      ...ProductVariantFields
    }
    options {
      id
      name
      values
      optionValues {
        id
        name
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
        firstSelectableVariant {
          ...ProductVariantFields
        }
      }
    }
    adjacentVariants {
      ...ProductVariantFields
    }
    seo {
      title
      description
    }
    category {
      ...TaxonomyCategoryFields
    }
    collections(first: 10) {
      edges {
        node {
          handle
        }
      }
    }
  }
`,
  [PRODUCT_VARIANT_FRAGMENT, TAXONOMY_CATEGORY_FRAGMENT],
);

export const PRODUCT_WITH_VARIANTS_FRAGMENT = gql(
  `#graphql
  fragment ProductWithVariantsFields on Product {
    ...ProductFields
    selectedOrFirstAvailableVariant {
      ...BundleRelationshipFields
    }
    variants(first: 250) {
      edges {
        node {
          ...ProductVariantFields
        }
      }
    }
  }
`,
  [BUNDLE_RELATIONSHIPS_FRAGMENT, PRODUCT_FRAGMENT],
);

export const PRODUCT_CARD_FRAGMENT = gql(
  `#graphql
  fragment ProductCardFields on Product {
    id
    title
    handle
    vendor
    availableForSale
    isGiftCard
    featuredImage {
      url
        altText
        width
        height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      image {
        url
        altText
        width
        height
      }
      selectedOptions {
        name
        value
      }
    }
  }
`,
);

export const FILTERABLE_PRODUCT_CARD_FRAGMENT = gql(
  `#graphql
  fragment FilterableProductCardFields on Product {
    ...ProductCardFields
    options {
      name
      optionValues {
        name
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
        firstSelectableVariant {
          image {
            url
        altText
        width
        height
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);
