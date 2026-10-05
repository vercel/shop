import { gql } from "@shopify/hydrogen";

export const SHOP_POLICY_FRAGMENT = gql(`#graphql
  fragment ShopPolicyFields on ShopPolicy {
    body
    handle
    title
  }
`);
