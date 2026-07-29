export type BotIdCheckLevel = "basic" | "deepAnalysis";

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
    enabled: false,
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
    enabled: false,
  },
  botid: {
    checkLevel: "basic",
    enabled: false,
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
    name: "Vercel Shop",
    url: defaultUrl,
  },
} satisfies ShopConfig;
