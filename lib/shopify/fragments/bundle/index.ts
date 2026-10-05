import { gql } from "@shopify/hydrogen";

export const BUNDLE_COMPONENT_VARIANT_FRAGMENT = gql(`#graphql
  fragment BundleComponentVariantFields on ProductVariant {
    id
    title
    image {
      url
        altText
        width
        height
    }
    product {
      id
      title
      handle
      featuredImage {
        url
        altText
        width
        height
      }
    }
  }
`);

export const BUNDLE_RELATIONSHIPS_FRAGMENT = gql(
  `#graphql
  fragment BundleRelationshipFields on ProductVariant {
    requiresComponents
    groupedBy(first: 10) {
      nodes {
        ...BundleComponentVariantFields
      }
    }
    # 30 is Shopify's per-bundle component maximum, so this can never truncate
    components(first: 30) {
      nodes {
        quantity
        productVariant {
          ...BundleComponentVariantFields
        }
      }
    }
  }
`,
  [BUNDLE_COMPONENT_VARIANT_FRAGMENT],
);
