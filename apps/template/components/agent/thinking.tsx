"use client";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  if (!active) return null;
  const toolLabels: Record<string, string> = {
    "add-cart-note": "Adding your note…",
    "add-to-cart": "Adding to cart…",
    "browse-collection": "Browsing the collection…",
    "get-cart": "Checking your cart…",
    "get-product-details": "Looking up product details…",
    "get-recommendations": "Finding recommendations…",
    "list-collections": "Looking at collections…",
    navigate: "Finding the page…",
    "present-products": "Preparing product cards…",
    "search-products": "Searching products…",
    policies__search_shop_policies_and_faqs: "Checking store policies…",
    shopify__search_catalog: "Searching products…",
    "update-cart-item": "Updating your cart…",
  };
  return (
    <p className="shimmer w-fit text-muted-foreground text-sm">
      {(tool ? toolLabels[tool] : undefined) ?? "Thinking…"}
    </p>
  );
}
