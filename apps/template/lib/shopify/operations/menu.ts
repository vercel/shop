import { cacheLife, cacheTag } from "next/cache";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";
import { type ShopifyMenuResponse, transformShopifyMenu } from "../transforms/menu";
import type { Menu } from "../types/menu";

const MENU_ITEM_FIELDS_FRAGMENT = `#graphql
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
` as const;

const GET_MENU_QUERY = `#graphql
  ${MENU_ITEM_FIELDS_FRAGMENT}
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
` as const;

export async function getMenu({ handle }: { handle: string }): Promise<Menu | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  const response = await storefront.request<ShopifyMenuResponse>(GET_MENU_QUERY, {
    variables: { handle },
  });
  assertStorefrontOk(response, "getMenu");

  return transformShopifyMenu(response.data.menu);
}
