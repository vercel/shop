import type { Menu, MenuItem, MenuItemType } from "../types/menu";
import { transformShopifyMenuItemUrl } from "../utils";

export type ShopifyMenuItem = {
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

export type ShopifyMenuResponse = {
  menu: {
    id: string;
    handle: string;
    title: string;
    items: ShopifyMenuItem[];
  } | null;
};

function transformMenuItem(item: ShopifyMenuItem): MenuItem {
  return {
    id: item.id,
    title: item.title,
    url: transformShopifyMenuItemUrl(item.url, item.type),
    type: item.type,
    items: (item.items ?? []).map(transformMenuItem),
  };
}

export function transformShopifyMenu(menu: ShopifyMenuResponse["menu"]): Menu | null {
  if (!menu) return null;

  return {
    id: menu.id,
    handle: menu.handle,
    title: menu.title,
    items: menu.items.map(transformMenuItem),
  };
}
