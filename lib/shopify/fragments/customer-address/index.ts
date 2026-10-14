import { gql } from "@shopify/hydrogen/customer-account";

export const ADDRESS_FRAGMENT = gql(`#graphql
  fragment AddressFields on CustomerAddress {
    address1
    address2
    city
    company
    countryCode
    firstName
    formatted
    id
    lastName
    phoneNumber
    zip
    zoneCode
  }
`);
