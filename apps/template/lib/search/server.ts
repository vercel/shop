import "server-only";
import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

const PRODUCT_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchProductFragment on Product {
    availableForSale
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      altText
      height
      url
      width
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    vendor
  }
`);

const COLLECTION_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchCollectionFragment on Collection {
    handle
    title
  }
`);

const QUERY_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchQueryFragment on SearchQuerySuggestion {
    styledText
    text
  }
`);

export const predictiveSearchHandlers = createPredictiveSearchServerHandlers({
  fragments: {
    collection: COLLECTION_FRAGMENT,
    product: PRODUCT_FRAGMENT,
    query: QUERY_FRAGMENT,
  },
  limit: 3,
  types: ["PRODUCT", "COLLECTION", "QUERY"],
});
