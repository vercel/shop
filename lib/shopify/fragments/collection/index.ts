import { gql } from "@shopify/hydrogen";

export const COLLECTION_FIELDS_FRAGMENT = gql(
  `#graphql
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    image {
      url
        altText
        width
        height
    }
    updatedAt
    seo {
      title
      description
    }
  }
`,
);
