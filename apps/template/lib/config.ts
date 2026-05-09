import type { MenuItem } from "@/lib/shopify/types/menu";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export type SocialPlatform =
  | "facebook"
  | "github"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "tiktok"
  | "x"
  | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop",
  socialLinks: [] as SocialLink[],
  url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
} as const;

export const navItems: MenuItem[] = [
  {
    id: "default-nav-shop",
    title: "Shop",
    url: "/search",
    type: "HTTP",
    items: [
      {
        id: "default-nav-shop-new-arrivals",
        title: "New Arrivals",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "default-nav-shop-new-arrivals-latest-drops",
            title: "Latest Drops",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-new-arrivals-back-in-stock",
            title: "Back in Stock",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-new-arrivals-coming-soon",
            title: "Coming Soon",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "default-nav-shop-featured",
        title: "Featured",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "default-nav-shop-featured-best-sellers",
            title: "Best Sellers",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-featured-editorial-picks",
            title: "Editorial Picks",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-featured-gift-guide",
            title: "Gift Guide",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "default-nav-shop-categories",
        title: "Categories",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "default-nav-shop-categories-accessories",
            title: "Accessories",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-categories-apparel",
            title: "Apparel",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-categories-home",
            title: "Home",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "default-nav-shop-collections",
        title: "Collections",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "default-nav-shop-collections-summer-edit",
            title: "Summer Edit",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-collections-travel-ready",
            title: "Travel Ready",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-collections-workspace",
            title: "Workspace",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "default-nav-shop-support",
        title: "Support",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "default-nav-shop-support-size-guide",
            title: "Size Guide",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-support-shipping",
            title: "Shipping",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "default-nav-shop-support-returns",
            title: "Returns",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: "default-nav-about",
    title: "About",
    url: "/about",
    type: "HTTP",
    items: [],
  },
];

export const footerItems: MenuItem[] = [
  {
    id: "default-footer-shop",
    title: "Shop",
    url: "/search",
    type: "HTTP",
    items: [
      {
        id: "default-footer-shop-new-arrivals",
        title: "New Arrivals",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-shop-best-sellers",
        title: "Best Sellers",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-shop-gift-cards",
        title: "Gift Cards",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-shop-sale",
        title: "Sale",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "default-footer-help",
    title: "Help",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "default-footer-help-contact",
        title: "Contact",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-help-shipping",
        title: "Shipping",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-help-returns",
        title: "Returns",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-help-order-status",
        title: "Order Status",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "default-footer-company",
    title: "Company",
    url: "/about",
    type: "HTTP",
    items: [
      {
        id: "default-footer-company-about",
        title: "About",
        url: "/about",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-company-journal",
        title: "Journal",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-company-careers",
        title: "Careers",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-company-press",
        title: "Press",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "default-footer-resources",
    title: "Resources",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "default-footer-resources-size-guide",
        title: "Size Guide",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-resources-store-locator",
        title: "Store Locator",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-resources-affiliates",
        title: "Affiliates",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-resources-sustainability",
        title: "Sustainability",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "default-footer-legal",
    title: "Legal",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "default-footer-legal-privacy",
        title: "Privacy Policy",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-legal-terms",
        title: "Terms of Service",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-legal-accessibility",
        title: "Accessibility",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "default-footer-legal-cookie-settings",
        title: "Cookie Settings",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
];
