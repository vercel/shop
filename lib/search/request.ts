import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

const PRODUCT_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchProductFragment on Product {
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
    product: PRODUCT_FRAGMENT,
    query: QUERY_FRAGMENT,
  },
  limit: 3,
  types: ["PRODUCT", "QUERY"],
});
