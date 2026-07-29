import { enterpriseFooterItems, enterpriseNavItems, socialLinks } from "./enterprise-navigation";
import type { MenuItem } from "./shopify/types/menu";

export type BotIdCheckLevel = "basic" | "deepAnalysis";

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

// Vercel injects bare domains (no protocol); NEXT_PUBLIC_BASE_URL follows the same convention.
const bareHost =
  trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || "") ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL;

const defaultUrl = bareHost ? `https://${bareHost}` : "http://localhost:3000";

export const shopConfig = {
  agent: {
    enabled: true,
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
    enabled: true,
  },
  botid: {
    checkLevel: "basic",
    enabled: true,
  },
  navigation: {
    footer: enterpriseFooterItems,
    nav: enterpriseNavItems,
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
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ship Shop",
    socialLinks,
    url: defaultUrl,
  },
} satisfies ShopConfig;
