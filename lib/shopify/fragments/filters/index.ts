import { gql } from "@shopify/hydrogen";

export const FILTER_FRAGMENT = gql(`#graphql
  fragment FilterFields on Filter {
    id
    label
    type
    presentation
    values {
      id
      label
      count
      input
      swatch {
        color
        image {
          previewImage {
            url
          }
        }
      }
    }
  }
`);
