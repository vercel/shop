import type { MenuItem } from "@/lib/shopify/types/menu";

// Hardcoded demo footer menu. Same shape as the nav menu (MenuItem[] from
// lib/shopify/types/menu.ts). Swap to getMenu("footer", locale) when a
// storefront wires up a Shopify-managed footer.

export const defaultFooterItems: MenuItem[] = [
  {
    id: "footer-shop",
    title: "Shop",
    url: "/search",
    type: "HTTP",
    items: [
      { id: "footer-shop-mens", title: "Mens", url: "/search?q=mens", type: "HTTP", items: [] },
      {
        id: "footer-shop-womens",
        title: "Womens",
        url: "/search?q=womens",
        type: "HTTP",
        items: [],
      },
      { id: "footer-shop-home", title: "Home", url: "/search?q=home", type: "HTTP", items: [] },
      { id: "footer-shop-sale", title: "Sale", url: "/search?q=sale", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-help",
    title: "Help",
    url: "/search?q=help",
    type: "HTTP",
    items: [
      {
        id: "footer-help-contact",
        title: "Contact us",
        url: "/search?q=contact",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-help-shipping",
        title: "Shipping",
        url: "/search?q=shipping",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-help-returns",
        title: "Returns",
        url: "/search?q=returns",
        type: "HTTP",
        items: [],
      },
      { id: "footer-help-faq", title: "FAQ", url: "/search?q=faq", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-company",
    title: "Company",
    url: "/about",
    type: "HTTP",
    items: [
      { id: "footer-company-about", title: "About", url: "/about", type: "HTTP", items: [] },
      {
        id: "footer-company-careers",
        title: "Careers",
        url: "/search?q=careers",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-company-press",
        title: "Press",
        url: "/search?q=press",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-company-sustainability",
        title: "Sustainability",
        url: "/search?q=sustainability",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "footer-account",
    title: "Account",
    url: "/account",
    type: "HTTP",
    items: [
      {
        id: "footer-account-signin",
        title: "Sign in",
        url: "/account/login",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-account-orders",
        title: "Track order",
        url: "/account/orders",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-account-wishlist",
        title: "Wishlist",
        url: "/search?q=wishlist",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-account-gifts",
        title: "Gift cards",
        url: "/search?q=gift+cards",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "footer-connect",
    title: "Connect",
    url: "/search?q=connect",
    type: "HTTP",
    items: [
      {
        id: "footer-connect-newsletter",
        title: "Newsletter",
        url: "/search?q=newsletter",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-connect-stores",
        title: "Stores",
        url: "/search?q=stores",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-connect-affiliates",
        title: "Affiliates",
        url: "/search?q=affiliates",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-connect-wholesale",
        title: "Wholesale",
        url: "/search?q=wholesale",
        type: "HTTP",
        items: [],
      },
    ],
  },
];
