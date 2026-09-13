import { gql } from "@shopify/hydrogen";

// Hydrogen's default fragment omits `updatedAt`, which its own useCartAnalytics requires, and the selling plan name.
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
      }
    }
  }
`);
