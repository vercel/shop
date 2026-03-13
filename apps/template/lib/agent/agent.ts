import { stepCountIs, ToolLoopAgent, type ToolLoopAgentSettings } from "ai";
import { getAgentContext } from "./context";
import { getSystemPrompt } from "./prompt";
import { addCartNoteTool } from "./tools/add-cart-note";
import { addToCartTool } from "./tools/add-to-cart";
import { browseCollectionTool } from "./tools/browse-collection";
import { getAddressesTool } from "./tools/get-addresses";
import { getCartTool } from "./tools/get-cart";
import { getOrderDetailsTool } from "./tools/get-order-details";
import { getOrderHistoryTool } from "./tools/get-orders";
import { getProductDetailsTool } from "./tools/get-product-details";
import { getRecommendationsTool } from "./tools/get-recommendations";
import { listCollectionsTool } from "./tools/list-collections";
import { manageAddressTool } from "./tools/manage-address";
import { navigateTool } from "./tools/navigate";
import { removeFromCartTool } from "./tools/remove-from-cart";
import { searchProductsTool } from "./tools/search-products";
import { updateCartItemTool } from "./tools/update-cart-item";

const defaults: ToolLoopAgentSettings = {
  model: "anthropic/claude-sonnet-4.6",
};

const guestTools = {
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

const authTools = {
  getOrderHistory: getOrderHistoryTool(),
  getOrderDetails: getOrderDetailsTool(),
  getAddresses: getAddressesTool(),
  manageAddress: manageAddressTool(),
};

export function createAgent() {
  const { user } = getAgentContext();
  const tools =
    user.type === "user" ? { ...guestTools, ...authTools } : guestTools;

  const agent = new ToolLoopAgent({
    ...defaults,
    instructions: getSystemPrompt(),
    stopWhen: stepCountIs(10),
    tools,
  });

  return agent;
}
