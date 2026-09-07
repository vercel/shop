import type {
  Menu,
  MenuItem,
  MenuItemType,
  ShopifyMenu,
  ShopifyMenuItem,
} from "@/lib/shopify/transforms/menu/types";

function transformMenuItem(item: ShopifyMenuItem, storeDomain: string): MenuItem {
  return {
    id: item.id,
    title: item.title,
    url: transformShopifyMenuItemUrl(item.url ?? null, item.type, storeDomain),
    type: item.type,
    items: (item.items ?? []).map((child) => transformMenuItem(child, storeDomain)),
  };
}

export function transformShopifyMenu(
  menu: ShopifyMenu | null | undefined,
  storeDomain: string,
): Menu | null {
  if (!menu) return null;

  return {
    id: menu.id,
    handle: menu.handle,
    title: menu.title,
    items: menu.items.map((item) => transformMenuItem(item, storeDomain)),
  };
}

export function transformShopifyMenuItemUrl(
  url: string | null,
  type: MenuItemType,
  storeDomain: string,
): string {
  if (type === "FRONTPAGE") return "/";
  if (type === "SEARCH") return "/search";

  if (!url) return "/";

  try {
    const parsed = new URL(url);
    const isInternal =
      storeDomain && parsed.hostname === new URL(`https://${storeDomain}`).hostname;

    if (!isInternal) return url;

    let path = parsed.pathname;
    path = path.replace(/^\/[a-z]{2}(-[a-z]{2,4})?\//i, "/");

    return path;
  } catch {
    return url;
  }
}
