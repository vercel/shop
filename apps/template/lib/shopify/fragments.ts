export const MONEY_FRAGMENT = `#graphql
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
` as const;

export const IMAGE_FRAGMENT = `#graphql
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
` as const;

// Note: Does not include IMAGE_FRAGMENT - expects parent to include it
export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  ${MONEY_FRAGMENT}
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    price {
      ...MoneyFields
    }
    compareAtPrice {
      ...MoneyFields
    }
    selectedOptions {
      name
      value
    }
    image {
      ...ImageFields
    }
  }
` as const;

// Lightweight variant reference for bundle relationships. Relies on the parent
// to include IMAGE_FRAGMENT (matches PRODUCT_VARIANT_FRAGMENT).
export const BUNDLE_COMPONENT_VARIANT_FRAGMENT = `#graphql
  fragment BundleComponentVariantFields on ProductVariant {
    id
    title
    image {
      ...ImageFields
    }
    product {
      id
      title
      handle
      featuredImage {
        ...ImageFields
      }
    }
  }
` as const;

// The selected/purchasable variant: base fields plus Shopify bundle relationships.
// Used only where one variant is resolved (the shell default + the suspended query),
// never for the full matrix or cards. Relies on the parent to include IMAGE_FRAGMENT.
export const PURCHASABLE_PRODUCT_VARIANT_FRAGMENT = `#graphql
  ${PRODUCT_VARIANT_FRAGMENT}
  ${BUNDLE_COMPONENT_VARIANT_FRAGMENT}
  fragment PurchasableProductVariantFields on ProductVariant {
    ...ProductVariantFields
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
` as const;

export const TAXONOMY_CATEGORY_FRAGMENT = `#graphql
  fragment TaxonomyCategoryFields on TaxonomyCategory {
    id
    name
    ancestors {
      id
      name
    }
  }
` as const;

export const METAFIELD_FRAGMENT = `#graphql
  fragment MetafieldFields on Metafield {
    key
    namespace
    value
    type
  }
` as const;

// A bundle's component lines carry Shopify edit instructions (e.g. canRemove:false
// so a shopper can't pull one product out of a fixed bundle); the parent bundle line
// is a ComponentizableCartLine whose lineComponents are ordinary CartLines.
export const CART_FRAGMENT = `#graphql
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  fragment CartLineFields on CartLine {
    id
    quantity
    instructions {
      canRemove
      canUpdateQuantity
    }
    cost {
      totalAmount {
        ...MoneyFields
      }
    }
    discountAllocations {
      __typename
      discountedAmount {
        ...MoneyFields
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
          ...ImageFields
        }
        price {
          ...MoneyFields
        }
        product {
          id
          title
          handle
          featuredImage {
            ...ImageFields
          }
        }
      }
    }
  }
  fragment ComponentizableCartLineFields on ComponentizableCartLine {
    id
    quantity
    cost {
      totalAmount {
        ...MoneyFields
      }
    }
    discountAllocations {
      __typename
      discountedAmount {
        ...MoneyFields
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
          ...ImageFields
        }
        price {
          ...MoneyFields
        }
        product {
          id
          title
          handle
          featuredImage {
            ...ImageFields
          }
        }
      }
    }
    lineComponents {
      ...CartLineFields
    }
  }
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
        ...MoneyFields
      }
      subtotalAmount {
        ...MoneyFields
      }
    }
    discountCodes {
      code
      applicable
    }
    discountAllocations {
      __typename
      discountedAmount {
        ...MoneyFields
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
        ...MoneyFields
      }
      balance {
        ...MoneyFields
      }
    }
    deliveryGroups(first: 5) {
      nodes {
        selectedDeliveryOption {
          title
          estimatedCost {
            ...MoneyFields
          }
        }
      }
    }
  }
` as const;

export const COLLECTION_FIELDS_FRAGMENT = `#graphql
  ${IMAGE_FRAGMENT}
  fragment CollectionFields on Collection {
    handle
    title
    description
    image {
      ...ImageFields
    }
    updatedAt
    seo {
      title
      description
    }
  }
` as const;

export const PRODUCT_FRAGMENT = `#graphql
  ${IMAGE_FRAGMENT}
  ${PURCHASABLE_PRODUCT_VARIANT_FRAGMENT}
  ${TAXONOMY_CATEGORY_FRAGMENT}
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
    featuredImage {
      ...ImageFields
    }
    media(first: 10) {
      edges {
        node {
          mediaContentType
          ... on MediaImage {
            image {
              ...ImageFields
            }
          }
          ... on Video {
            previewImage {
              ...ImageFields
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
        ...MoneyFields
      }
      maxVariantPrice {
        ...MoneyFields
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyFields
      }
      maxVariantPrice {
        ...MoneyFields
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    variantsCount {
      count
    }
    selectedOrFirstAvailableVariant {
      ...PurchasableProductVariantFields
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
            ...ImageFields
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
` as const;

// Extends the slim shell with the full variant matrix. Used by the AI agent and
// markdown routes, which enumerate variants; the PDP uses the slim ProductFields
// plus a per-selection variant query instead.
export const PRODUCT_WITH_VARIANTS_FRAGMENT = `#graphql
  ${PRODUCT_FRAGMENT}
  fragment ProductWithVariantsFields on Product {
    ...ProductFields
    variants(first: 250) {
      edges {
        node {
          ...ProductVariantFields
        }
      }
    }
  }
` as const;

export const PRODUCT_CARD_FRAGMENT = `#graphql
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  fragment ProductCardFields on Product {
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
      maxVariantPrice {
        ...MoneyFields
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyFields
      }
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      image {
        url
      }
      selectedOptions {
        name
        value
      }
    }
  }
` as const;
