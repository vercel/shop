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

export const ORDER_SUMMARY_FRAGMENT = gql(`#graphql
  fragment OrderSummaryFields on Order {
    financialStatus
    fulfillmentStatus
    id
    name
    number
    processedAt
    totalPrice {
      amount
      currencyCode
    }
  }
`);

export const ORDER_FRAGMENT = gql(
  `#graphql
  fragment OrderFields on Order {
    ...OrderSummaryFields
    lineItems(first: 50) {
      nodes {
        image {
          altText
          height
          url
          width
        }
        quantity
        title
        totalPrice {
          amount
          currencyCode
        }
        variantTitle
      }
    }
    shippingAddress {
      ...AddressFields
    }
    statusPageUrl
    subtotal {
      amount
      currencyCode
    }
    totalShipping {
      amount
      currencyCode
    }
    totalTax {
      amount
      currencyCode
    }
  }
`,
  [ADDRESS_FRAGMENT, ORDER_SUMMARY_FRAGMENT],
);

export const CUSTOMER_PROFILE_FRAGMENT = gql(`#graphql
  fragment CustomerProfileFields on Customer {
    emailAddress {
      emailAddress
    }
    firstName
    lastName
  }
`);
