import type { MenuItem } from "@/lib/shopify/types/menu";

export type AgentToolName =
  | "addCartNote"
  | "addToCart"
  | "browseCollection"
  | "getCart"
  | "getCatalogProduct"
  | "getProductDetails"
  | "getProductRecommendations"
  | "listCollections"
  | "navigateUser"
  | "removeFromCart"
  | "searchCatalog"
  | "searchProducts"
  | "searchShopPoliciesAndFaqs"
  | "updateCartItemQuantity";

export interface MetafieldIdentifier {
  key: string;
  namespace: string;
}

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
    maxSteps: number;
    model: string;
    tools: AgentToolName[];
  };
  analytics: {
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
  navigation: {
    footer: MenuItem[];
    nav: MenuItem[];
  };
  pdp: {
    bundles: {
      enabled: boolean;
    };
    complementaryProducts: {
      enabled: boolean;
      limit: number;
    };
    relatedProducts: {
      enabled: boolean;
      limit: number;
    };
    specifications: {
      metafields: MetafieldIdentifier[];
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

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const shopConfig = {
  agent: {
    enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_AGENT, false),
    maxSteps: 10,
    model: "google/gemini-3.5-flash",
    tools: [
      "addCartNote",
      "addToCart",
      "browseCollection",
      "getCart",
      "getCatalogProduct",
      "getProductDetails",
      "getProductRecommendations",
      "listCollections",
      "navigateUser",
      "removeFromCart",
      "searchCatalog",
      "searchProducts",
      "searchShopPoliciesAndFaqs",
      "updateCartItemQuantity",
    ],
  },
  analytics: {
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
      {
        id: "default-nav-about",
        title: "About",
        url: "/about",
        type: "HTTP",
        items: [],
      },
    ],
  },
  pdp: {
    bundles: {
      enabled: true,
    },
    complementaryProducts: {
      enabled: true,
      limit: 4,
    },
    relatedProducts: {
      enabled: true,
      limit: 4,
    },
    specifications: {
      metafields: [],
    },
  },
  site: {
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop",
    socialLinks: [],
    url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
  },
} satisfies ShopConfig;
