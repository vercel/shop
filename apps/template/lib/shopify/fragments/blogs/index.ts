import { gql } from "@shopify/hydrogen";

export const ARTICLE_SUMMARY_FRAGMENT = gql(`#graphql
  fragment ArticleSummaryFields on Article {
    authorV2 {
      name
    }
    content(truncateAt: 240)
    excerpt
    handle
    image {
      altText
      height
      url
      width
    }
    publishedAt
    title
  }
`);

export const BLOG_FRAGMENT = gql(`#graphql
  fragment BlogFields on Blog {
    handle
    seo {
      description
      title
    }
    title
  }
`);
