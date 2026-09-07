import { gql } from "@shopify/hydrogen/customer-account";

import { ADDRESS_FRAGMENT } from "@/lib/shopify/fragments/customer-address";

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
