/**
 * Variant Cart Status Component
 *
 * CACHE STRATEGY: Hybrid - Server initial + Client optimistic updates
 * - Server component fetches initial cart state
 * - Client component shows optimistic updates from CartContext
 * - Auto-syncs when server revalidates
 */

import { Suspense } from "react";
import { getCart } from "@/lib/shopify/operations/cart";
import type { ProductDetails } from "@/lib/types";
import { CartStatusClient } from "./cart-status-client";

async function Render({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  const [product, cart] = await Promise.all([productPromise, getCart()]);

  // Check if THIS specific variant is in the cart
  // Note: Cart uses variant IDs, but we need to match by product handle
  // For now, this component may need refactoring to work with handles
  const cartItem = cart?.lines.find(
    (item) => item.merchandise.id === product.handle,
  );
  const initialQuantity = cartItem?.quantity ?? 0;

  // Render client component for optimistic updates
  return (
    <CartStatusClient
      variantId={product.handle}
      initialQuantity={initialQuantity}
    />
  );
}

export function CartStatus({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  // No fallback as it's more likely to just disappear
  return (
    <Suspense>
      <Render productPromise={productPromise} />
    </Suspense>
  );
}
