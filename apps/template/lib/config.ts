import { enterpriseFooterItems, enterpriseNavItems, socialLinks } from "./enterprise-navigation";
import type { MenuItem } from "./shopify/types/menu";

export type BotIdCheckLevel = "basic" | "deepAnalysis";

type ShopifyConsentMode = "custom-banner" | "default-banner" | "no-banner";

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
    isEnabled: boolean;
  };
  analytics: {
    shopify: {
      consentMode: ShopifyConsentMode;
      isEnabled: boolean;
    };
    speedInsights: {
      isEnabled: boolean;
    };
    vercel: {
      isEnabled: boolean;
    };
  };
  auth: {
    isEnabled: boolean;
  };
  botid: {
    checkLevel: BotIdCheckLevel;
    isEnabled: boolean;
  };
  navigation: {
    footer: MenuItem[];
    nav: MenuItem[];
  };
  pdp: {
    bundles: {
      isEnabled: boolean;
    };
    buyWithShop: {
      isEnabled: boolean;
    };
    complementaryProducts: {
      isEnabled: boolean;
    };
    quantityPicker: {
      isEnabled: boolean;
    };
    relatedProducts: {
      isEnabled: boolean;
    };
  };
  site: {
    name: string;
    socialLinks: SocialLink[];
    url: string;
  };
  webmcp: {
    isEnabled: boolean;
  };
}

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
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ship Shop",
    socialLinks,
    url: defaultUrl,
  },
  webmcp: {
    isEnabled: false,
  },
} satisfies ShopConfig;
