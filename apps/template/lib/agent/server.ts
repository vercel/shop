import { isStepCount, ToolLoopAgent } from "ai";

import { shopConfig } from "@/lib/config";

import { catalog } from ".";
import type { Locale } from "../i18n";
import type { PageContext } from "./routes";
import { addCartNoteTool, addToCartTool, getCartTool, updateCartItemTool } from "./tools/cart";
import { browseCollectionTool, listCollectionsTool } from "./tools/collections";
import { navigateTool } from "./tools/navigate";
import { searchShopPoliciesTool } from "./tools/policies";
import {
  getProductDetailsTool,
  getRecommendationsTool,
  searchProductsTool,
} from "./tools/products";

export type User = { locale: Locale; type: "guest" };

export interface AgentContext {
  cart: string | undefined;
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

function describePage(page: PageContext): string {
  if (!page) return "";
  switch (page.type) {
    case "cart":
      return "The shopper is viewing their cart.";
    case "collection":
      return `The shopper is browsing the "${page.handle}" collection.`;
    case "home":
      return "The shopper is on the home page. Help them discover products or collections.";
    case "product":
      return `The shopper is viewing the product "${page.handle}". When they say "this product", call getProductDetails with that handle.`;
    case "search":
      return page.query
        ? `The shopper is searching for "${page.query}".`
        : "The shopper is on the search page.";
    default:
      return "";
  }
}

function createSystemPrompt(context: AgentContext): string {
  const { page, user } = context;

  const instructions = [
    `You're a helpful shopping assistant for ${shopConfig.site.name}.`,
    "Never use emojis. Always respond in the same language as the shopper, preferring their language when unclear.",
    `The active locale is ${user.locale}.`,
    "You can search products, browse collections, recommend products, answer store policy questions, manage the cart, and build on-site links.",
    "Never guess policy, shipping, returns, payment, warranty, sizing, or care answers; use searchShopPolicies.",
    describePage(page),
  ].filter(Boolean);

  return `${instructions.join("\n\n")}\n\n${catalog.prompt({
    customRules: [
      "When a tool returns products, render every one of them: an AgentProductCard per product, wrapped in a single AgentProductGrid.",
      "AgentProductCard takes only a handle. Never invent props for titles, prices, images, or availability — the card resolves those from the tool result.",
      "Render AgentCartSummary after getCart or any cart mutation. It takes no props and shows the live cart, so never restate cart contents, quantities, or totals as text.",
      "Render AgentVariantPicker with a handle when a product has multiple variants and the shopper has not chosen one. The shopper picks and adds to cart in that component, so do not ask them to type a variant.",
      "Do not use repeat, $item, $state, $index, or $bindItem. Give each element its own /elements/<key> entry and list child keys in the parent's children array.",
      "The root value must exactly match a key you add under /elements, and every generated element must be reachable from it. Emit exactly one top-level element per turn.",
      "Include brief conversational text around generated UI.",
    ],
    mode: "chat",
  })}`;
}

const tools = {
  addCartNote: addCartNoteTool,
  addToCart: addToCartTool,
  browseCollection: browseCollectionTool,
  getCart: getCartTool,
  getProductDetails: getProductDetailsTool,
  getProductRecommendations: getRecommendationsTool,
  listCollections: listCollectionsTool,
  navigateUser: navigateTool,
  searchProducts: searchProductsTool,
  searchShopPolicies: searchShopPoliciesTool,
  updateCartItem: updateCartItemTool,
};

export function createAgent() {
  return new ToolLoopAgent({
    instructions: createSystemPrompt(getAgentContext()),
    model: "openai/gpt-5.6-luna",
    stopWhen: isStepCount(10),
    tools,
  });
}
