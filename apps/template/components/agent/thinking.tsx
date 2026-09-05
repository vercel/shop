"use client";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  if (!active) return null;
  const toolLabels: Record<string, string> = {
    addCartNote: "Adding your note…",
    addToCart: "Adding to cart…",
    browseCollection: "Browsing the collection…",
    getCart: "Checking your cart…",
    getProductDetails: "Looking up product details…",
    getProductRecommendations: "Finding recommendations…",
    listCollections: "Looking at collections…",
    navigateUser: "Finding the page…",
    searchProducts: "Searching products…",
    searchShopPolicies: "Checking store policies…",
    updateCartItem: "Updating your cart…",
  };
  return (
    <p className="shimmer w-fit text-muted-foreground text-sm">
      {(tool ? toolLabels[tool] : undefined) ?? "Thinking…"}
    </p>
  );
}
