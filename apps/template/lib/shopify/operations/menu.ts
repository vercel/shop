import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../fetch";
import { type ShopifyMenuResponse, transformShopifyMenu } from "../transforms/menu";
import type { Menu } from "../types/menu";

const MENU_ITEM_FIELDS_FRAGMENT = `
  fragment MenuItemFields on MenuItem {
    id
    title
    url
    type
    tags
    resource {
      ... on Collection { handle }
      ... on Product { handle }
      ... on Page { handle }
    }
  }
`;

const GET_MENU_QUERY = `
  query getMenu($handle: String!) {
    menu(handle: $handle) {
      id
      handle
      title
      items {
        ...MenuItemFields
        items {
          ...MenuItemFields
          items {
            ...MenuItemFields
          }
        }
      }
    }
  }
  ${MENU_ITEM_FIELDS_FRAGMENT}
`;

export async function getMenu({ handle }: { handle: string }): Promise<Menu | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  const data = await shopifyFetch<ShopifyMenuResponse>({
    operation: "getMenu",
    query: GET_MENU_QUERY,
    variables: { handle },
  });

  return transformShopifyMenu(data.menu);
}
