import { isStepCount, ToolLoopAgent } from "ai";

import { shopConfig } from "@/lib/config";

import { catalog } from ".";
import type { PageContext } from "./routes";
import { createCartTools } from "./tools/cart";
import { browseCollectionTool, listCollectionsTool } from "./tools/collections";
import { navigateTool } from "./tools/navigate";
import { searchShopPoliciesTool } from "./tools/policies";
import {
  getProductDetailsTool,
  getRecommendationsTool,
  searchProductsTool,
} from "./tools/products";

export interface AgentContext {
  cartId: string | undefined;
  page: PageContext;
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

function createSystemPrompt(page: PageContext): string {
  const instructions = [
    `You're a helpful shopping assistant for ${shopConfig.site.name}.`,
    "Never use emojis. Always respond in the same language as the shopper, preferring their language when unclear.",
    `The storefront display locale is ${shopConfig.localization.locale}; its commerce country is ${shopConfig.localization.country} and catalog language is ${shopConfig.localization.language}.`,
    "You can search products, browse collections, recommend products, answer store policy questions, manage the cart, and build on-site links.",
    "Never guess policy, shipping, returns, payment, warranty, sizing, or care answers; use searchShopPolicies.",
    'When the shopper names a required product option such as a colour or size, pass it to searchProducts as options (e.g. [{"name":"Color","value":"Orange"}]) and keep the query focused on the product itself ("jackets"). Fewer results than expected is the correct outcome; state how many matched.',
    "Only describe results as matching a colour, size, or other option when the tool returned them under that option. If searchProducts reports unmatchedOptions, tell the shopper nothing matched and offer to drop or change the constraint — never present other products as if they satisfied it.",
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
    mode: "inline",
  })}`;
}

export function createAgent({ cartId, page }: AgentContext) {
  const { addCartNote, addToCart, getCart, updateCartItem } = createCartTools({ cartId });

  return new ToolLoopAgent({
    instructions: createSystemPrompt(page),
    model: "openai/gpt-5.6-luna",
    stopWhen: isStepCount(10),
    tools: {
      addCartNote,
      addToCart,
      browseCollection: browseCollectionTool,
      getCart,
      getProductDetails: getProductDetailsTool,
      getProductRecommendations: getRecommendationsTool,
      listCollections: listCollectionsTool,
      navigateUser: navigateTool,
      searchProducts: searchProductsTool,
      searchShopPolicies: searchShopPoliciesTool,
      updateCartItem,
    },
  });
}
