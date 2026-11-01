// Eve names each tool after its file in agent/tools/, so rename both together.
export const AGENT_TOOL = {
  browseCollections: "browse-collections",
  getCart: "get-cart",
  getProductDetails: "get-product-details",
  getRecommendations: "get-recommendations",
  navigate: "navigate",
  presentProducts: "present-products",
  searchPolicies: "search-policies",
  searchProducts: "search-products",
  updateCart: "update-cart",
} as const;

export const PRODUCT_CARD_TOOLS: ReadonlySet<string> = new Set([
  AGENT_TOOL.browseCollections,
  AGENT_TOOL.getRecommendations,
  AGENT_TOOL.presentProducts,
]);
