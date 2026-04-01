import { getAllLocalMarketingPageSlugs, getLocalMarketingPage } from "@/lib/content/pages";
import {
  addCartDeliveryAddress,
  addToCart,
  createCart,
  createCartWithoutCookie,
  getCart,
  getCartDeliveryOptions,
  getCartSelectableAddressId,
  linkCartToCustomer,
  removeFromCart,
  updateCart,
  updateCartBuyerIdentity,
  updateCartDeliveryAddress,
  updateCartNote,
} from "@/lib/shopify/operations/cart";
import { getCollection, getCollections } from "@/lib/shopify/operations/collections";
import { getMegamenuData } from "@/lib/shopify/operations/megamenu";
import { getMenu } from "@/lib/shopify/operations/menu";
import {
  buildProductFiltersFromParams,
  getCollectionProducts,
  getProduct,
  getProductById,
  getProductRecommendations,
  getProducts,
  getProductsByHandles,
  getProductsByIds,
} from "@/lib/shopify/operations/products";
import { predictiveSearch } from "@/lib/shopify/operations/search";
import { getAllProductHandles } from "@/lib/shopify/operations/sitemap";

import type { CommerceProvider } from "../types";

export const shopifyProvider: CommerceProvider = {
  products: {
    getProduct,
    getProducts,
    getCollectionProducts,
    getProductRecommendations,
    getProductById,
    getProductsByIds,
    getProductsByHandles,
    buildProductFiltersFromParams,
  },
  cart: {
    getCart,
    createCart,
    createCartWithoutCookie,
    addToCart,
    updateCart,
    removeFromCart,
    updateCartBuyerIdentity,
    linkCartToCustomer,
    updateCartNote,
    getCartSelectableAddressId,
    addCartDeliveryAddress,
    getCartDeliveryOptions,
    updateCartDeliveryAddress,
  },
  collections: {
    getCollections,
    getCollection,
  },
  search: {
    predictiveSearch,
  },
  menu: {
    getMenu,
    getMegamenuData,
  },
  cms: {
    getLocalMarketingPage,
    getAllLocalMarketingPageSlugs,
  },
  sitemap: {
    getAllProductHandles,
  },
};
