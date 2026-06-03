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

// Note: Does not include IMAGE_FRAGMENT - expects parent to include it
export const PRODUCT_VARIANT_FRAGMENT = `
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
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              ...MoneyFields
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
      }
    }
    cost {
      totalAmount {
        ...MoneyFields
      }
      subtotalAmount {
        ...MoneyFields
      }
      totalTaxAmount {
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
  ${IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
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
    variants(first: 50) {
      edges {
        node {
          ...ProductVariantFields
        }
      }
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
