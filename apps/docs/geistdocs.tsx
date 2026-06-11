import type { GeistdocsAgentReadinessConfig } from "@vercel/geistdocs/config";

import { Logo as ShopLogo } from "@/components/logo";
import { docsDescription, siteName } from "@/lib/site";

export const Logo = ShopLogo;

export const github = {
  branch: "main",
  editPath: "apps/docs/content/docs/{path}",
  owner: "vercel",
  repo: "shop",
};

export const nav = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Demo",
    href: "https://template.vercel.shop",
    external: true,
  },
  {
    label: "GitHub",
    href: `https://github.com/${github.owner}/${github.repo}`,
    external: true,
  },
];

export const suggestions = [
  "What is Vercel Shop?",
  "How do I connect my Shopify store?",
  "How do agents extend my storefront?",
  "How does the cart stay fast?",
];

export const title = "Vercel Shop Documentation";

export const prompt =
  "You are a helpful assistant specializing in answering questions about Vercel Shop, the standard for Shopify development.";

export const agent = {
  product: {
    name: siteName,
    description: docsDescription,
    category: "Commerce",
    audience: ["Storefront developers", "AI agents extending storefronts"],
    useCases: [
      "Build a Shopify storefront on Next.js",
      "Extend a storefront with AI agents and skills",
      "Serve storefront content to AI agents via content negotiation",
    ],
  },
  links: [
    {
      label: "Vercel Shop source",
      href: `https://github.com/${github.owner}/${github.repo}`,
      description: "Source repository for the Vercel Shop template and docs",
    },
    {
      label: "Demo storefront",
      href: "https://template.vercel.shop",
      description: "Live demo of the Vercel Shop template",
    },
  ],
} satisfies GeistdocsAgentReadinessConfig;

export const translations = {
  en: {
    displayName: "English",
  },
};

export const basePath: string | undefined = undefined;

/**
 * Unique identifier for this site, used in markdown request tracking analytics.
 */
export const siteId: string | undefined = "vercel-shop-docs";
