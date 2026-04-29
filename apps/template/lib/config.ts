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
    id: "nav-shop",
    title: "Shop",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "nav-shop-featured",
        title: "Featured",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-shop-featured-new", title: "New Arrivals", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-featured-best",
            title: "Bestsellers",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-shop-featured-sale", title: "Sale", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-featured-gift",
            title: "Gift Cards",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-featured-limited",
            title: "Limited Edition",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-shop-apparel",
        title: "Apparel",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-shop-apparel-tops", title: "Tops", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-apparel-bottoms", title: "Bottoms", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-apparel-outerwear",
            title: "Outerwear",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-apparel-activewear",
            title: "Activewear",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-apparel-loungewear",
            title: "Loungewear",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-shop-footwear",
        title: "Footwear",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "nav-shop-footwear-sneakers",
            title: "Sneakers",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-shop-footwear-boots", title: "Boots", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-footwear-sandals",
            title: "Sandals",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-footwear-slippers",
            title: "Slippers",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-shop-accessories",
        title: "Accessories",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-shop-accessories-bags", title: "Bags", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-accessories-hats", title: "Hats", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-accessories-belts", title: "Belts", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-accessories-sunglasses",
            title: "Sunglasses",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-accessories-jewelry",
            title: "Jewelry",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-shop-home",
        title: "Home",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-shop-home-bedding", title: "Bedding", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-home-bath", title: "Bath", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-home-kitchen", title: "Kitchen", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-home-decor", title: "Decor", url: "#", type: "HTTP", items: [] },
        ],
      },
    ],
  },
  {
    id: "nav-lookbook",
    title: "Lookbook",
    url: "#",
    type: "HTTP",
    items: [],
  },
  {
    id: "nav-stores",
    title: "Stores",
    url: "#",
    type: "HTTP",
    items: [],
  },
];

export const footerItems: MenuItem[] = [
  {
    id: "footer-shop",
    title: "Shop",
    url: "#",
    type: "HTTP",
    items: [
      { id: "footer-shop-new", title: "New Arrivals", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-best", title: "Bestsellers", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-sale", title: "Sale", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-gift", title: "Gift Cards", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-help",
    title: "Help",
    url: "#",
    type: "HTTP",
    items: [
      { id: "footer-help-shipping", title: "Shipping", url: "#", type: "HTTP", items: [] },
      { id: "footer-help-returns", title: "Returns", url: "#", type: "HTTP", items: [] },
      { id: "footer-help-size", title: "Size Guide", url: "#", type: "HTTP", items: [] },
      { id: "footer-help-status", title: "Order Status", url: "#", type: "HTTP", items: [] },
      { id: "footer-help-faq", title: "FAQ", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-about",
    title: "About",
    url: "#",
    type: "HTTP",
    items: [
      { id: "footer-about-story", title: "Our Story", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-about-sustainability",
        title: "Sustainability",
        url: "#",
        type: "HTTP",
        items: [],
      },
      { id: "footer-about-press", title: "Press", url: "#", type: "HTTP", items: [] },
      { id: "footer-about-careers", title: "Careers", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-connect",
    title: "Connect",
    url: "#",
    type: "HTTP",
    items: [
      { id: "footer-connect-contact", title: "Contact", url: "#", type: "HTTP", items: [] },
      { id: "footer-connect-newsletter", title: "Newsletter", url: "#", type: "HTTP", items: [] },
      { id: "footer-connect-affiliates", title: "Affiliates", url: "#", type: "HTTP", items: [] },
      { id: "footer-connect-wholesale", title: "Wholesale", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-legal",
    title: "Legal",
    url: "#",
    type: "HTTP",
    items: [
      { id: "footer-legal-terms", title: "Terms of Service", url: "#", type: "HTTP", items: [] },
      { id: "footer-legal-privacy", title: "Privacy Policy", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-legal-accessibility",
        title: "Accessibility",
        url: "#",
        type: "HTTP",
        items: [],
      },
      { id: "footer-legal-cookies", title: "Cookie Policy", url: "#", type: "HTTP", items: [] },
    ],
  },
];
