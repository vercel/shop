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
export type MenuItemType =
  | "ARTICLE"
  | "BLOG"
  | "CATALOG"
  | "COLLECTION"
  | "COLLECTIONS"
  | "CUSTOMER_ACCOUNT_PAGE"
  | "FRONTPAGE"
  | "HTTP"
  | "METAOBJECT"
  | "PAGE"
  | "PRODUCT"
  | "SEARCH"
  | "SHOP_POLICY";

export type MenuItem = {
  id: string;
  title: string;
  url: string;
  type: MenuItemType;
  items: MenuItem[];
};

export type Menu = {
  id: string;
  handle: string;
  title: string;
  items: MenuItem[];
};
