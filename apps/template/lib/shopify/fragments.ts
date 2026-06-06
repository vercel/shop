export const MONEY_FRAGMENT = `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = `
  ${IMAGE_FRAGMENT}
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
    product {
      handle
    }
  }
`;

export const BUNDLE_COMPONENT_VARIANT_FRAGMENT = `
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
`;

export const PURCHASABLE_PRODUCT_VARIANT_FRAGMENT = `
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
    components(first: 30) {
      nodes {
        quantity
        productVariant {
          ...BundleComponentVariantFields
        }
      }
    }
  }
`;

export const PRODUCT_SELECTION_FRAGMENT = `
  ${PURCHASABLE_PRODUCT_VARIANT_FRAGMENT}
  fragment ProductSelectionFields on Product {
    handle
    encodedVariantExistence
    encodedVariantAvailability
    options {
      id
      name
      optionValues {
        id
        name
        firstSelectableVariant {
          ...ProductVariantFields
        }
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
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...PurchasableProductVariantFields
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariantFields
    }
  }
`;

export const TAXONOMY_CATEGORY_FRAGMENT = `
  fragment TaxonomyCategoryFields on TaxonomyCategory {
    id
    name
    ancestors {
      id
      name
    }
  }
`;

export const METAFIELD_FRAGMENT = `
  fragment MetafieldFields on Metafield {
    key
    namespace
    value
    type
  }
`;

export const CART_FRAGMENT = `
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
`;

export const COLLECTION_FIELDS_FRAGMENT = `
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
`;

export const PRODUCT_FRAGMENT = `
  ${PRODUCT_SELECTION_FRAGMENT}
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
    variantsCount {
      count
    }
    ...ProductSelectionFields
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
`;

export const PRODUCT_CARD_FRAGMENT = `
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
`;
