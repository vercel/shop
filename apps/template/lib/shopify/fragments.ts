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

export const PRODUCT_FRAGMENT = `
  ${IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  ${TAXONOMY_CATEGORY_FRAGMENT}
  ${METAFIELD_FRAGMENT}
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
    metafields(identifiers: [
      {namespace: "custom", key: "material"},
      {namespace: "custom", key: "dimensions"},
      {namespace: "custom", key: "weight"},
      {namespace: "custom", key: "connectivity"},
      {namespace: "custom", key: "battery_life"},
      {namespace: "custom", key: "warranty"},
      {namespace: "custom", key: "country_of_origin"},
      {namespace: "custom", key: "model_number"},
      {namespace: "specs", key: "material"},
      {namespace: "specs", key: "dimensions"},
      {namespace: "specs", key: "weight"},
      {namespace: "specs", key: "connectivity"},
      {namespace: "specs", key: "battery_life"},
      {namespace: "specs", key: "warranty"},
    ]) {
      ...MetafieldFields
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
    images(first: 10) {
      edges {
        node {
          ...ImageFields
        }
      }
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
    variants(first: 50) {
      edges {
        node {
          image {
            url
          }
        }
      }
    }
  }
`;
