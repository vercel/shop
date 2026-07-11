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

export interface ShopConfig {
  agent: {
    enabledByDefault: boolean;
    maxSteps: number;
    model: string;
    tools: AgentToolName[];
  };
  auth: {
    enabledByDefault: boolean;
    providerId: "shopify";
  };
  pdp: {
    bundles: {
      enabled: boolean;
    };
    relatedProducts: {
      enabled: boolean;
      limit: number;
    };
    specifications: {
      metafields: MetafieldIdentifier[];
    };
    upsells: {
      enabled: boolean;
      limit: number;
    };
  };
}

export const shopConfig = {
  agent: {
    enabledByDefault: false,
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
  auth: {
    enabledByDefault: false,
    providerId: "shopify",
  },
  pdp: {
    bundles: {
      enabled: true,
    },
    relatedProducts: {
      enabled: true,
      limit: 4,
    },
    specifications: {
      metafields: [],
    },
    upsells: {
      enabled: true,
      limit: 4,
    },
  },
} satisfies ShopConfig;
