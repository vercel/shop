import { gql } from "@shopify/hydrogen/customer-account";

export const ADDRESS_FRAGMENT = gql(`#graphql
  fragment AddressFields on CustomerAddress {
    address1
    address2
    city
    company
    firstName
    formatted
    id
    lastName
    phoneNumber
    territoryCode
    zip
    zoneCode
  }
`);
