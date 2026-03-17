import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale } from "@/lib/i18n";

import { shopifyFetch } from "../client";
import type { Menu, MenuItem, MenuItemType } from "../types/menu";
import { transformShopifyMenuItemUrl } from "../utils";

type ShopifyMenuItem = {
  id: string;
  title: string;
  url: string | null;
  type: MenuItemType;
  tags: string[];
  resource: {
    handle?: string;
  } | null;
  items: ShopifyMenuItem[];
};

type ShopifyMenuResponse = {
  menu: {
    id: string;
    handle: string;
    title: string;
    items: ShopifyMenuItem[];
  } | null;
};

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

function transformMenuItem(item: ShopifyMenuItem): MenuItem {
  return {
    id: item.id,
    title: item.title,
    url: transformShopifyMenuItemUrl(item.url, item.type),
    type: item.type,
    items: (item.items ?? []).map(transformMenuItem),
  };
}

function transformMenu(menu: ShopifyMenuResponse["menu"]): Menu | null {
  if (!menu) return null;

  return {
    id: menu.id,
    handle: menu.handle,
    title: menu.title,
    items: menu.items.map(transformMenuItem),
  };
}

export async function getMenu(
  handle: string,
  _locale: string = defaultLocale,
): Promise<Menu | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  const data = await shopifyFetch<ShopifyMenuResponse>({
    operation: "getMenu",
    query: GET_MENU_QUERY,
    variables: { handle },
  });

  return transformMenu(data.menu);
}
