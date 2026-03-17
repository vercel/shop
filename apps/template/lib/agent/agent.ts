import { stepCountIs, ToolLoopAgent, type ToolLoopAgentSettings } from "ai";

import { addCartNoteTool } from "./tools/add-cart-note";
import { addToCartTool } from "./tools/add-to-cart";
import { browseCollectionTool } from "./tools/browse-collection";
import { getAgentContext } from "./context";
import { getCartTool } from "./tools/get-cart";
import { getProductDetailsTool } from "./tools/get-product-details";
import { getRecommendationsTool } from "./tools/get-recommendations";
import { getSystemPrompt } from "./prompt";
import { listCollectionsTool } from "./tools/list-collections";
import { navigateTool } from "./tools/navigate";
import { removeFromCartTool } from "./tools/remove-from-cart";
import { searchProductsTool } from "./tools/search-products";
import { updateCartItemTool } from "./tools/update-cart-item";

const defaults: ToolLoopAgentSettings = {
  model: "anthropic/claude-sonnet-4.6",
};

const tools = {
  searchProducts: searchProductsTool(),
  getProductDetails: getProductDetailsTool(),
  getProductRecommendations: getRecommendationsTool(),
  listCollections: listCollectionsTool(),
  browseCollection: browseCollectionTool(),
  addToCart: addToCartTool(),
  getCart: getCartTool(),
  updateCartItemQuantity: updateCartItemTool(),
  removeFromCart: removeFromCartTool(),
  addCartNote: addCartNoteTool(),
  navigateUser: navigateTool(),
};

export function createAgent() {
  const agent = new ToolLoopAgent({
    ...defaults,
    instructions: getSystemPrompt(),
    stopWhen: stepCountIs(10),
    tools,
  });

  return agent;
}
