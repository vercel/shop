export type MenuItemType =
  | "FRONTPAGE"
  | "COLLECTION"
  | "COLLECTIONS"
  | "PRODUCT"
  | "CATALOG"
  | "PAGE"
  | "BLOG"
  | "ARTICLE"
  | "SEARCH"
  | "SHOP_POLICY"
  | "HTTP"
  | "METAOBJECT"
  | "CUSTOMER_ACCOUNT_PAGE";

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
