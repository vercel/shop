import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../fetch";

interface ProductHandleNode {
  handle: string;
  updatedAt: string;
}

interface ProductsPage {
  edges: Array<{ node: ProductHandleNode }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

const GET_PRODUCT_HANDLES_QUERY = `
  query getProductHandlesForSitemap($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          handle
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PAGE_SIZE = 250;

export async function getAllProductHandles(): Promise<ProductHandleNode[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const products: ProductHandleNode[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const pageData: { products: ProductsPage } = await shopifyFetch({
      operation: "getProductHandlesForSitemap",
      query: GET_PRODUCT_HANDLES_QUERY,
      variables: {
        first: PAGE_SIZE,
        after,
      },
    });

    products.push(...pageData.products.edges.map((edge) => edge.node));
    hasNextPage = pageData.products.pageInfo.hasNextPage;
    after = pageData.products.pageInfo.endCursor;
  }

  return products;
}
