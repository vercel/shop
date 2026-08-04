export type BotIdCheckLevel = "basic" | "deepAnalysis";

export type ShopifyConsentMode = "custom-banner" | "default-banner" | "no-banner";

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
  // TODO(laugharn): revert to false before merging — temporarily on to test the assistant in preview.
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
} satisfies ShopConfig;
