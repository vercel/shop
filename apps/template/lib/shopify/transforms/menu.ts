import type { Menu, MenuItem, MenuItemType } from "../types/menu";
import { transformShopifyMenuItemUrl } from "../utils";

// Structural shape shared by every nesting level of the menu query.
export interface ShopifyMenuItem {
  id: string;
  items?: ShopifyMenuItem[];
  title: string;
  type: MenuItemType;
  url?: string | null;
}

export interface ShopifyMenu {
  handle: string;
  id: string;
  items: ShopifyMenuItem[];
  title: string;
}

function transformMenuItem(item: ShopifyMenuItem): MenuItem {
  return {
    id: item.id,
    title: item.title,
    url: transformShopifyMenuItemUrl(item.url ?? null, item.type),
    type: item.type,
    items: (item.items ?? []).map(transformMenuItem),
  };
}

export function transformShopifyMenu(menu: ShopifyMenu | null | undefined): Menu | null {
  if (!menu) return null;

  return {
    id: menu.id,
    handle: menu.handle,
    title: menu.title,
    items: menu.items.map(transformMenuItem),
  };
}
