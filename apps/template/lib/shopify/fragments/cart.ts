import { gql } from "@shopify/hydrogen";

// The default Hydrogen fragment omits analytics timestamps, catalog prices, and line discounts.
export const CART_FRAGMENT = gql(/* GraphQL */ `
  fragment CartFragment on Cart {
    updatedAt
    lines(first: 250) {
      nodes {
        sellingPlanAllocation {
          sellingPlan {
            name
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
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`);
