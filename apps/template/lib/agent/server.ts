import { isStepCount, ToolLoopAgent } from "ai";

import { shopConfig } from "@/shop.config";

import { catalog } from ".";
import type { Locale } from "../i18n";
import type { ProductDetails } from "../types";
import { addCartNoteTool } from "./tools/add-cart-note";
import { addToCartTool } from "./tools/add-to-cart";
import { browseCollectionTool } from "./tools/browse-collection";
import { getCartTool } from "./tools/get-cart";
import { getCatalogProductTool } from "./tools/get-catalog-product";
import { getProductDetailsTool } from "./tools/get-product-details";
import { getRecommendationsTool } from "./tools/get-recommendations";
import { listCollectionsTool } from "./tools/list-collections";
import { navigateTool } from "./tools/navigate";
import { removeFromCartTool } from "./tools/remove-from-cart";
import { searchCatalogTool } from "./tools/search-catalog";
import { searchProductsTool } from "./tools/search-products";
import { searchShopPoliciesTool } from "./tools/search-shop-policies";
import { updateCartItemTool } from "./tools/update-cart-item";

export type User = { locale: Locale; type: "guest" };

export type PageContext =
  | { type: "cart" }
  | { handle: string; title: string; type: "collection" }
  | { type: "home" }
  | { product: ProductDetails; type: "product" }
  | { query: string; type: "search" }
  | null;

export interface AgentContext {
  cart: string | undefined;
  chatId: string;
  page: PageContext;
  user: User;
}

const agentContext = new AsyncLocalStorage<AgentContext>();

export function getAgentContext(): AgentContext {
  const context = agentContext.getStore();
  if (!context) throw new Error("Agent context not found");
  return context;
}

export function withAgentContext<T>(context: AgentContext, callback: () => T): T {
  return agentContext.run(context, callback);
}

function createSystemPrompt(context: AgentContext): string {
  const { page, user } = context;
  let prompt = `You're a helpful shopping assistant for ${shopConfig.site.name}. Never use emojis. Always respond in the same language as the user, preferring the user's language when unclear.\n\nThe active locale is ${user.locale}.\n\nYou can search products, browse collections, get recommendations and product details, answer store policy questions, manage the cart, and generate on-site navigation links. Prefer searchCatalog for vague, descriptive, or preference-driven requests; use searchProducts for exact keyword lookups or price sorting. If searchCatalog fails or returns nothing, retry with searchProducts. Never guess policy, shipping, returns, payment, warranty, sizing, or care answers; use searchShopPolicies.\n`;

  if (page?.type === "home") {
    prompt += "\nThe user is on the home page. Help them discover products or collections.\n";
  } else if (page?.type === "product") {
    const { product } = page;
    const variants = (product.variants ?? [])
      .map((variant) => {
        const options = variant.selectedOptions
          .map((option) => `${option.name}: ${option.value}`)
          .join(", ");
        return `- ${variant.title} (${options}) — ${variant.price.amount} ${variant.price.currencyCode}; ${variant.availableForSale ? "in stock" : "out of stock"}; variantId: ${variant.id}`;
      })
      .join("\n");
    prompt += `\nThe user is viewing ${product.title} (handle: ${product.handle}). Price: ${product.price.amount} ${product.price.currencyCode}. Available: ${product.availableForSale ? "yes" : "no"}. Description: ${product.description}\nVariants:\n${variants}\nWhen the user says "this product", use this trusted context. Ask for variant choices when multiple variants exist before adding to cart.\n`;
  } else if (page?.type === "collection") {
    prompt += `\nThe user is browsing the ${page.title} collection (handle: ${page.handle}).\n`;
  } else if (page?.type === "search") {
    prompt += `\nThe user is on the search page${page.query ? ` with query "${page.query}"` : ""}.\n`;
  } else if (page?.type === "cart") {
    prompt += "\nThe user is viewing their shopping cart.\n";
  }

  return `${prompt}\n${catalog.prompt({
    customRules: [
      "When searchProducts, searchCatalog, browseCollection, getProductRecommendations, getProductDetails, or getCatalogProduct returns products successfully, render them with AgentProductCard components. Wrap multiple cards in AgentProductGrid.",
      "Pass price and compareAtPrice strings directly from tool results.",
      "When getCart returns a non-empty cart, render AgentCartSummary using its items, subtotal, total, totalQuantity, and checkoutUrl.",
      "After addToCart succeeds, render AgentCartConfirmation using known product context.",
      "When multiple variants need a choice, render AgentVariantPicker from getProductDetails and ask the user which variant they want.",
      "Include brief conversational text around generated UI.",
    ],
    mode: "chat",
  })}`;
}

const tools = {
  addCartNote: addCartNoteTool(),
  addToCart: addToCartTool(),
  browseCollection: browseCollectionTool(),
  getCart: getCartTool(),
  getCatalogProduct: getCatalogProductTool(),
  getProductDetails: getProductDetailsTool(),
  getProductRecommendations: getRecommendationsTool(),
  listCollections: listCollectionsTool(),
  navigateUser: navigateTool(),
  removeFromCart: removeFromCartTool(),
  searchCatalog: searchCatalogTool(),
  searchProducts: searchProductsTool(),
  searchShopPoliciesAndFaqs: searchShopPoliciesTool(),
  updateCartItemQuantity: updateCartItemTool(),
};

export function createAgent() {
  return new ToolLoopAgent({
    instructions: createSystemPrompt(getAgentContext()),
    model: "google/gemini-3.5-flash",
    stopWhen: isStepCount(10),
    tools,
  });
}
