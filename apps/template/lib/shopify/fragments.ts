import { gql } from "@shopify/hydrogen";

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
  }
`,
);

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

export const PURCHASABLE_PRODUCT_VARIANT_FRAGMENT = gql(
  `#graphql
  fragment PurchasableProductVariantFields on ProductVariant {
    ...BundleRelationshipFields
    ...ProductVariantFields
  }
`,
  [BUNDLE_RELATIONSHIPS_FRAGMENT, PRODUCT_VARIANT_FRAGMENT],
);

export const TAXONOMY_CATEGORY_FRAGMENT = gql(`#graphql
  fragment TaxonomyCategoryFields on TaxonomyCategory {
    id
    name
    ancestors {
      id
      name
    }
  }
`);

export const FILTER_FRAGMENT = gql(`#graphql
  fragment FilterFields on Filter {
    id
    label
    type
    presentation
    values {
      id
      label
      count
      input
      swatch {
        color
        image {
          previewImage {
            url
          }
        }
      }
    }
  }
`);

export const CART_LINE_FRAGMENT = gql(`#graphql
  fragment CartLineFields on CartLine {
    id
    quantity
    instructions {
      canRemove
      canUpdateQuantity
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
    }
    discountAllocations {
      __typename
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        title
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
        price {
          amount
        currencyCode
        }
        compareAtPrice {
          amount
        currencyCode
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
    }
  }
`);

// Fixed bundle components carry Shopify edit restrictions on nested CartLines.
export const COMPONENTIZABLE_CART_LINE_FRAGMENT = gql(
  `#graphql
  fragment ComponentizableCartLineFields on ComponentizableCartLine {
    id
    quantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
    }
    discountAllocations {
      __typename
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        title
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
        price {
          amount
        currencyCode
        }
        compareAtPrice {
          amount
        currencyCode
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
    }
    lineComponents {
      ...CartLineFields
    }
  }
`,
  [CART_LINE_FRAGMENT],
);

export const CART_FRAGMENT = gql(
  `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    lines(first: 50) {
      nodes {
        ...CartLineFields
        ...ComponentizableCartLineFields
      }
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    discountCodes {
      code
      applicable
    }
    discountAllocations {
      __typename
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        amount
        currencyCode
      }
      balance {
        amount
        currencyCode
      }
    }
    deliveryGroups(first: 5) {
      nodes {
        selectedDeliveryOption {
          title
          estimatedCost {
            amount
        currencyCode
          }
        }
      }
    }
  }
`,
  [COMPONENTIZABLE_CART_LINE_FRAGMENT],
);

export const COLLECTION_FIELDS_FRAGMENT = gql(
  `#graphql
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    image {
      url
        altText
        width
        height
    }
    updatedAt
    seo {
      title
      description
    }
  }
`,
);

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
          image {
            url
        altText
        width
        height
          }
        }
      }
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
