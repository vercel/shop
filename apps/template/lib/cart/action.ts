"use server";

import { withFallback } from "@/lib/shopify/errors";
import { getCart } from "@/lib/shopify/operations/cart";

/** Uses Shopify's cart permalink format (`/cart/{numericId}:{qty}`) — no API cart is created. */
export async function buyNowAction(
  merchandiseId: string,
  quantity: number = 1,
): Promise<{ checkoutUrl: string | null; error?: string }> {
  if (!merchandiseId) {
    return { checkoutUrl: null, error: "Invalid product ID" };
  }

  if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
    return { checkoutUrl: null, error: "Quantity must be between 1 and 99" };
  }

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    return { checkoutUrl: null, error: "Store domain not configured" };
  }

  let numericId: string | null = merchandiseId;
  if (merchandiseId.startsWith("gid://") || !merchandiseId.match(/^\d+$/)) {
    let decoded = merchandiseId;
    if (!decoded.startsWith("gid://")) {
      try {
        decoded = atob(decoded);
      } catch {
        return { checkoutUrl: null, error: "Invalid variant ID" };
      }
    }
    const match = decoded.match(/gid:\/\/shopify\/\w+\/(\d+)/);
    numericId = match?.[1] ?? null;
  }

  if (!numericId) {
    return { checkoutUrl: null, error: "Could not resolve variant ID" };
  }

  const checkoutUrl = `https://${domain}/cart/${numericId}:${quantity}?payment=shop_pay`;
  return { checkoutUrl };
}

export async function prepareCheckoutAction(): Promise<{
  checkoutUrl: string | null;
}> {
  const cart = await withFallback(getCart(), undefined);
  return { checkoutUrl: cart?.checkoutUrl ?? null };
}
