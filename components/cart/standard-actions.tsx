import { isShopifyScriptsEnabled } from "@/lib/config";

export function CartStandardActionsScript() {
  if (isShopifyScriptsEnabled) return null;

  return (
    <script
      crossOrigin="anonymous"
      defer
      id="shopify-standard-actions"
      src="https://cdn.shopify.com/storefront/standard-actions.js"
      type="module"
    />
  );
}
