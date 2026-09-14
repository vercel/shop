import { enterpriseFooterItems, enterpriseNavItems, socialLinks } from "../enterprise-navigation";
import type { ShopConfig } from "./types";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const shopConfig = {
  agent: {
    isEnabled: false,
  },
  analytics: {
    shopify: {
      consentMode: "default-banner",
      isEnabled: false,
    },
    speedInsights: {
      isEnabled: false,
    },
    vercel: {
      isEnabled: false,
    },
  },
  auth: {
    isEnabled: true,
  },
  botid: {
    checkLevel: "basic",
    isEnabled: true,
  },
  navigation: {
    footer: enterpriseFooterItems,
    nav: enterpriseNavItems,
  },
  browserAgents: {
    webmcp: {
      isEnabled: false,
    },
  },
  localization: {
    country: "US",
    language: "EN",
    locale: "en-US" as const,
  },
  pdp: {
    bundles: {
      isEnabled: true,
    },
    buyWithShop: {
      isEnabled: true,
    },
    complementaryProducts: {
      isEnabled: true,
    },
    quantityPicker: {
      isEnabled: true,
    },
    relatedProducts: {
      isEnabled: true,
    },
  },
  search: {
    isEnabled: true,
  },
  site: {
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ship Things",
    socialLinks,
    url: defaultUrl,
  },
} satisfies ShopConfig;
