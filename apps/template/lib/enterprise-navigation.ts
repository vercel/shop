import type { SocialLink } from "@/shop.config";

import type { MenuItem } from "./shopify/types/menu";

export const socialLinks: SocialLink[] = [
  { platform: "facebook", url: "https://www.facebook.com" },
  { platform: "instagram", url: "https://www.instagram.com" },
  { platform: "linkedin", url: "https://www.linkedin.com" },
  { platform: "tiktok", url: "https://www.tiktok.com" },
  { platform: "x", url: "https://x.com" },
  { platform: "youtube", url: "https://www.youtube.com" },
];

// Placeholder mega-menu navigation. Each top-level item opens a multi-column
// dropdown of "#" links until wired to real collections/pages.
export const enterpriseNavItems: MenuItem[] = [
  {
    id: "nav-shop",
    title: "Shop",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "nav-shop-apparel",
        title: "Apparel",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-shop-apparel-tshirts", title: "T-Shirts", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-apparel-hoodies",
            title: "Hoodies & Sweatshirts",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-apparel-jackets",
            title: "Jackets & Coats",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-apparel-pants",
            title: "Pants & Jeans",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-shop-apparel-shorts", title: "Shorts", url: "#", type: "HTTP", items: [] },
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
          { id: "nav-shop-footwear-sandals", title: "Sandals", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-footwear-loafers", title: "Loafers", url: "#", type: "HTTP", items: [] },
        ],
      },
      {
        id: "nav-shop-accessories",
        title: "Accessories",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "nav-shop-accessories-bags",
            title: "Bags & Backpacks",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-accessories-hats",
            title: "Hats & Beanies",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-shop-accessories-belts", title: "Belts", url: "#", type: "HTTP", items: [] },
          { id: "nav-shop-accessories-socks", title: "Socks", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-accessories-sunglasses",
            title: "Sunglasses",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-shop-collections",
        title: "Collections",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "nav-shop-collections-new",
            title: "New Arrivals",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-shop-collections-best",
            title: "Best Sellers",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-shop-collections-sale", title: "Sale", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-shop-collections-gift",
            title: "Gift Cards",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: "nav-featured",
    title: "Featured",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "nav-featured-season",
        title: "This Season",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "nav-featured-season-summer",
            title: "Summer Edit",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-featured-season-lookbook",
            title: "Lookbook",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-featured-season-trending",
            title: "Trending Now",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-featured-season-editors",
            title: "Editor's Picks",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-featured-fit",
        title: "Shop by Fit",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-featured-fit-slim", title: "Slim", url: "#", type: "HTTP", items: [] },
          { id: "nav-featured-fit-relaxed", title: "Relaxed", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-featured-fit-oversized",
            title: "Oversized",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-featured-fit-tailored", title: "Tailored", url: "#", type: "HTTP", items: [] },
        ],
      },
    ],
  },
  {
    id: "nav-company",
    title: "Company",
    url: "#",
    type: "HTTP",
    items: [
      {
        id: "nav-company-about",
        title: "About",
        url: "#",
        type: "HTTP",
        items: [
          { id: "nav-company-about-story", title: "Our Story", url: "#", type: "HTTP", items: [] },
          { id: "nav-company-about-careers", title: "Careers", url: "#", type: "HTTP", items: [] },
          {
            id: "nav-company-about-newsroom",
            title: "Newsroom",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-company-about-sustainability",
            title: "Sustainability",
            url: "#",
            type: "HTTP",
            items: [],
          },
        ],
      },
      {
        id: "nav-company-support",
        title: "Support",
        url: "#",
        type: "HTTP",
        items: [
          {
            id: "nav-company-support-contact",
            title: "Contact Us",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-company-support-shipping",
            title: "Shipping & Returns",
            url: "#",
            type: "HTTP",
            items: [],
          },
          {
            id: "nav-company-support-tracking",
            title: "Order Tracking",
            url: "#",
            type: "HTTP",
            items: [],
          },
          { id: "nav-company-support-faqs", title: "FAQs", url: "#", type: "HTTP", items: [] },
        ],
      },
    ],
  },
];

// Placeholder footer navigation. Column headers are non-links (empty url);
// leaf links point at "#" until wired up.
export const enterpriseFooterItems: MenuItem[] = [
  {
    id: "footer-shop",
    title: "Shop",
    url: "",
    type: "HTTP",
    items: [
      { id: "footer-shop-all", title: "Shop All", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-new", title: "New Arrivals", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-best", title: "Best Sellers", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-collections", title: "Collections", url: "#", type: "HTTP", items: [] },
      { id: "footer-shop-gift-cards", title: "Gift Cards", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-company",
    title: "Company",
    url: "",
    type: "HTTP",
    items: [
      { id: "footer-company-about", title: "About Us", url: "#", type: "HTTP", items: [] },
      { id: "footer-company-careers", title: "Careers", url: "#", type: "HTTP", items: [] },
      { id: "footer-company-newsroom", title: "Newsroom", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-company-sustainability",
        title: "Sustainability",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-company-investors",
        title: "Investor Relations",
        url: "#",
        type: "HTTP",
        items: [],
      },
    ],
  },
  {
    id: "footer-support",
    title: "Support",
    url: "",
    type: "HTTP",
    items: [
      { id: "footer-support-contact", title: "Contact Us", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-support-shipping",
        title: "Shipping & Returns",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-support-tracking",
        title: "Order Tracking",
        url: "#",
        type: "HTTP",
        items: [],
      },
      { id: "footer-support-faqs", title: "FAQs", url: "#", type: "HTTP", items: [] },
      { id: "footer-support-size-guide", title: "Size Guide", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-enterprise",
    title: "Enterprise",
    url: "",
    type: "HTTP",
    items: [
      { id: "footer-enterprise-wholesale", title: "Wholesale", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-enterprise-sales",
        title: "Enterprise Sales",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-enterprise-partnerships",
        title: "Partnerships",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-enterprise-affiliates",
        title: "Affiliate Program",
        url: "#",
        type: "HTTP",
        items: [],
      },
      { id: "footer-enterprise-api", title: "Developer API", url: "#", type: "HTTP", items: [] },
    ],
  },
  {
    id: "footer-legal",
    title: "Legal",
    url: "",
    type: "HTTP",
    items: [
      { id: "footer-legal-privacy", title: "Privacy Policy", url: "#", type: "HTTP", items: [] },
      { id: "footer-legal-terms", title: "Terms of Service", url: "#", type: "HTTP", items: [] },
      {
        id: "footer-legal-accessibility",
        title: "Accessibility",
        url: "#",
        type: "HTTP",
        items: [],
      },
      {
        id: "footer-legal-cookies",
        title: "Cookie Preferences",
        url: "#",
        type: "HTTP",
        items: [],
      },
      { id: "footer-legal-security", title: "Security", url: "#", type: "HTTP", items: [] },
    ],
  },
];
