import type { MenuItem } from "@/lib/shopify/types/menu";

export const defaultNavItems: MenuItem[] = [
  {
    id: "default-nav-shop",
    title: "Shop",
    url: "/search",
    type: "HTTP",
    items: [],
  },
  {
    id: "default-nav-about",
    title: "About",
    url: "/about",
    type: "HTTP",
    items: [],
  },
];
