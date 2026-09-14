import { gql } from "@shopify/hydrogen";

import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { MENU_ITEM_FIELDS_FRAGMENT } from "@/lib/shopify/fragments/menu";
import { storefront } from "@/lib/shopify/storefront/server";
import { transformShopifyMenu } from "@/lib/shopify/transforms/menu";
import type { Menu } from "@/lib/shopify/transforms/menu/types";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "";

const GET_MENU_QUERY = gql(
  `#graphql
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
`,
  [MENU_ITEM_FIELDS_FRAGMENT],
);

export async function fetchMenu({ handle }: { handle: string }): Promise<Menu | null> {
  const response = await storefront.request(GET_MENU_QUERY, { variables: { handle } });
  assertStorefrontOk(response, "getMenu");

  return transformShopifyMenu(response.data.menu, SHOPIFY_STORE_DOMAIN);
}
