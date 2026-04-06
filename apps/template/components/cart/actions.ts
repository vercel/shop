"use server";

import { isEnabledLocale } from "@/lib/i18n";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCart,
  updateCartBuyerIdentity,
  updateCartNote,
} from "@/lib/shopify/operations/cart";
import type { Cart } from "@/lib/types";

export type CartActionResult = {
  success: boolean;
  error?: string;
  cart?: Cart;
};

export async function removeFromCartAction(itemId: string): Promise<CartActionResult> {
  if (!itemId) {
    return {
      success: false,
      error: "Invalid item ID",
    };
  }

  try {
    const result = await removeFromCart([itemId]);

    if (!result) {
      return {
        success: false,
        error: "Failed to remove item from cart",
      };
    }

    const updatedCart = await getCart();

    return {
      success: true,
      cart: updatedCart,
    };
  } catch (error) {
    console.error("Remove from cart failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove item from cart",
    };
  }
}

export async function updateCartQuantityAction(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  if (!itemId) {
    return {
      success: false,
      error: "Invalid item ID",
    };
  }

  if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
    return {
      success: false,
      error: "Quantity must be between 1 and 99",
    };
  }

  try {
    const currentCart = await getCart();
    if (!currentCart) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    const item = currentCart.lines.find((line) => line.id === itemId);
    if (!item) {
      return {
        success: false,
        error: "Item not found in cart",
      };
    }

    const result = await updateCart([
      {
        id: itemId,
        merchandiseId: item.merchandise.id,
        quantity,
      },
    ]);

    if (!result) {
      return {
        success: false,
        error: "Failed to update item quantity",
      };
    }

    const updatedCart = await getCart();

    return {
      success: true,
      cart: updatedCart,
    };
  } catch (error) {
    console.error("Update cart quantity failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item quantity",
    };
  }
}

export async function addToCartAction(
  merchandiseId: string,
  quantity: number = 1,
): Promise<CartActionResult> {
  if (!merchandiseId) {
    return {
      success: false,
      error: "Invalid product ID",
    };
  }

  if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
    return {
      success: false,
      error: "Quantity must be between 1 and 99",
    };
  }

  try {
    const result = await addToCart([{ merchandiseId, quantity }]);

    if (!result) {
      return {
        success: false,
        error: "Failed to add item to cart",
      };
    }

    const updatedCart = await getCart();

    return {
      success: true,
      cart: updatedCart,
    };
  } catch (error) {
    console.error("Add to cart failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}

/**
 * Sync cart buyer identity with the current locale
 * This ensures the cart uses the correct country/currency for the locale
 * Should be called when the locale changes or on initial page load
 */
export async function syncCartLocaleAction(locale: string): Promise<CartActionResult> {
  if (!isEnabledLocale(locale)) {
    return {
      success: false,
      error: "Unsupported locale",
    };
  }

  try {
    const cart = await updateCartBuyerIdentity(locale);

    if (!cart) {
      // No cart exists, that's fine
      return { success: true };
    }

    return {
      success: true,
      cart,
    };
  } catch (error) {
    console.error("Sync cart locale failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync cart locale",
    };
  }
}

export async function updateCartNoteAction(note: string): Promise<CartActionResult> {
  try {
    const result = await updateCartNote(note);

    if (!result) {
      return {
        success: false,
        error: "Failed to update cart note",
      };
    }

    return {
      success: true,
      cart: result,
    };
  } catch (error) {
    console.error("Update cart note failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart note",
    };
  }
}

/**
 * Build a Shop Pay checkout URL for the given variant.
 * Uses Shopify's cart permalink format (`/cart/{numericId}:{qty}`)
 * so no cart needs to be created via the API.
 */
export async function buyNowAction(
  merchandiseId: string,
  quantity: number = 1,
): Promise<{ checkoutUrl: string | null; error?: string }> {
  if (!merchandiseId) {
    return { checkoutUrl: null, error: "Invalid product ID" };
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    return { checkoutUrl: null, error: "Store domain not configured" };
  }

  // Extract numeric ID from GID (e.g. "gid://shopify/ProductVariant/123" → "123")
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

/**
 * Return the checkout URL for the current cart.
 * Called before redirecting to Shopify checkout.
 */
export async function prepareCheckoutAction(): Promise<{
  checkoutUrl: string | null;
}> {
  try {
    const cart = await getCart();
    return { checkoutUrl: cart?.checkoutUrl ?? null };
  } catch (error) {
    console.error("Prepare checkout failed:", error);
    const cart = await getCart();
    return { checkoutUrl: cart?.checkoutUrl ?? null };
  }
}
