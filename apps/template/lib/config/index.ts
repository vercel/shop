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
      consent: {
        isEnabled: false,
        mode: "default-banner",
      },
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
    isEnabled: false,
  },
  botid: {
    checkLevel: "basic",
    isEnabled: false,
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
  redirects: {
    shopifyNotFound: {
      isEnabled: false,
    },
  },
  search: {
    isEnabled: true,
  },
  shopify: {
    webmcp: {
      isEnabled: false,
    },
  },
  site: {
    name: "Vercel Shop",
    url: defaultUrl,
  },
} satisfies ShopConfig;

export const isShopifyScriptsEnabled =
  shopConfig.analytics.shopify.isEnabled ||
  shopConfig.analytics.shopify.consent.isEnabled ||
  shopConfig.shopify.webmcp.isEnabled;
