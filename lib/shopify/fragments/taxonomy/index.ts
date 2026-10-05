import { gql } from "@shopify/hydrogen";

export const TAXONOMY_CATEGORY_FRAGMENT = gql(`#graphql
  fragment TaxonomyCategoryFields on TaxonomyCategory {
    id
    name
    ancestors {
      id
      name
    }
  }
`);
