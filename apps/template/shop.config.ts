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
} satisfies ShopConfig;
