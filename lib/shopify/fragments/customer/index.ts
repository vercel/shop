import { gql } from "@shopify/hydrogen/customer-account";

export const CUSTOMER_PROFILE_FRAGMENT = gql(`#graphql
  fragment CustomerProfileFields on Customer {
    emailAddress {
      emailAddress
    }
    firstName
    lastName
  }
`);
