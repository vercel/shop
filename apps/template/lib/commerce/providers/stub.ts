import type { CommerceProvider } from "../types";

function notConfigured(operation: string): never {
  throw new Error(
    `Commerce provider not configured: ${operation}(). Run /enable-commerce to set up a provider.`,
  );
}

/**
 * Stub provider that throws helpful errors for every operation.
 * Use this as the default when no commerce backend is configured.
 */
export const stubProvider: CommerceProvider = {
  products: {
    getProduct: () => notConfigured("getProduct"),
    getProducts: () => notConfigured("getProducts"),
    getCollectionProducts: () => notConfigured("getCollectionProducts"),
    getProductRecommendations: () => notConfigured("getProductRecommendations"),
    getProductById: () => notConfigured("getProductById"),
    getProductsByIds: () => notConfigured("getProductsByIds"),
    getProductsByHandles: () => notConfigured("getProductsByHandles"),
    buildProductFiltersFromParams: () => notConfigured("buildProductFiltersFromParams"),
  },
  cart: {
    getCart: () => notConfigured("getCart"),
    createCart: () => notConfigured("createCart"),
    createCartWithoutCookie: () => notConfigured("createCartWithoutCookie"),
    addToCart: () => notConfigured("addToCart"),
    updateCart: () => notConfigured("updateCart"),
    removeFromCart: () => notConfigured("removeFromCart"),
    updateCartBuyerIdentity: () => notConfigured("updateCartBuyerIdentity"),
    linkCartToCustomer: () => notConfigured("linkCartToCustomer"),
    updateCartNote: () => notConfigured("updateCartNote"),
    getCartSelectableAddressId: () => notConfigured("getCartSelectableAddressId"),
    addCartDeliveryAddress: () => notConfigured("addCartDeliveryAddress"),
    getCartDeliveryOptions: () => notConfigured("getCartDeliveryOptions"),
    updateCartDeliveryAddress: () => notConfigured("updateCartDeliveryAddress"),
  },
  collections: {
    getCollections: () => notConfigured("getCollections"),
    getCollection: () => notConfigured("getCollection"),
  },
  search: {
    predictiveSearch: () => notConfigured("predictiveSearch"),
  },
  menu: {
    getMenu: () => notConfigured("getMenu"),
    getMegamenuData: () => notConfigured("getMegamenuData"),
  },
  cms: {
    getLocalMarketingPage: () => notConfigured("getLocalMarketingPage"),
    getAllLocalMarketingPageSlugs: () => notConfigured("getAllLocalMarketingPageSlugs"),
  },
  sitemap: {
    getAllProductHandles: () => notConfigured("getAllProductHandles"),
  },
};
