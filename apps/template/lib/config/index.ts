import type { ShopConfig } from "./types";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const shopConfig = {
  agent: {
    isEnabled: true,
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
  site: {
    name: "Vercel Shop",
    url: defaultUrl,
  },
  webmcp: {
    isEnabled: false,
  },
} satisfies ShopConfig;
