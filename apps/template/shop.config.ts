import type { MenuItem } from "@/lib/shopify/types/menu";

export type BotIdCheckLevel = "basic" | "deepAnalysis";

export type ShopifyConsentMode = "custom-banner" | "default-banner" | "no-banner";

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

export interface ShopConfig {
  agent: {
    enabled: boolean;
  };
  analytics: {
    shopify: {
      consentMode: ShopifyConsentMode;
      enabled: boolean;
    };
    speedInsights: {
      enabled: boolean;
    };
    vercel: {
      enabled: boolean;
    };
  };
  auth: {
    enabled: boolean;
  };
  botid: {
    checkLevel: BotIdCheckLevel;
    enabled: boolean;
  };
  navigation: {
    footer: MenuItem[];
    nav: MenuItem[];
  };
  pdp: {
    bundles: {
      enabled: boolean;
    };
    buyWithShop: {
      enabled: boolean;
    };
    complementaryProducts: {
      enabled: boolean;
    };
    quantityPicker: {
      enabled: boolean;
    };
    relatedProducts: {
      enabled: boolean;
    };
  };
  site: {
    name: string;
    socialLinks: SocialLink[];
    url: string;
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function envFlag(value: string | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value === "1";
}

const agentEnabled = envFlag(process.env.NEXT_PUBLIC_ENABLE_AGENT, false);

const isDevelopment = process.env.NODE_ENV === "development";

// Shopify's hosted banner is the only default that keeps EU/UK/CA visitors trackable, so production opts into it unless overridden.
const shopifyConsentMode: ShopifyConsentMode =
  process.env.NEXT_PUBLIC_SHOPIFY_CONSENT_MODE === "custom-banner"
    ? "custom-banner"
    : process.env.NEXT_PUBLIC_SHOPIFY_CONSENT_MODE === "no-banner" || isDevelopment
      ? "no-banner"
      : "default-banner";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const shopConfig = {
  agent: {
    enabled: agentEnabled,
  },
  analytics: {
    shopify: {
      consentMode: shopifyConsentMode,
      enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_SHOPIFY_ANALYTICS, false),
    },
    speedInsights: {
      enabled: false,
    },
    vercel: {
      enabled: false,
    },
  },
  auth: {
    enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_AUTH, false),
  },
  botid: {
    checkLevel:
      process.env.NEXT_PUBLIC_BOTID_CHECK_LEVEL === "deepAnalysis" ? "deepAnalysis" : "basic",
    enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_BOTID, agentEnabled),
  },
  navigation: {
    footer: [],
    nav: [
      {
        id: "default-nav-shop",
        title: "Shop",
        url: "/collections/all",
        type: "HTTP",
        items: [],
      },
    ],
  },
  pdp: {
    bundles: {
      enabled: true,
    },
    buyWithShop: {
      enabled: true,
    },
    complementaryProducts: {
      enabled: true,
    },
    quantityPicker: {
      enabled: true,
    },
    relatedProducts: {
      enabled: true,
    },
  },
  site: {
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop",
    socialLinks: [],
    url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
  },
} satisfies ShopConfig;
