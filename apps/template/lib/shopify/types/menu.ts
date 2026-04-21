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
