"use server";

import { isEnabledLocale } from "@/lib/i18n";
import { withFallback } from "@/lib/shopify/errors";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCart,
  updateCartBuyerIdentity,
  updateCartDiscountCodes,
  updateCartNote,
} from "@/lib/shopify/operations/cart";
import type { Cart, CartWarning } from "@/lib/types";

export type CartActionResult = {
  cart?: Cart;
  error?: string;
  success: boolean;
  warnings?: CartWarning[];
};

const MAX_DISCOUNT_CODE_LENGTH = 64;
const DISCOUNT_CODE_PATTERN = /^[\x20-\x7E]+$/;

function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function removeFromCartAction(itemId: string): Promise<CartActionResult> {
  if (!itemId) {
    return {
      success: false,
      error: "Invalid item ID",
    };
  }

  try {
    const { cart, warnings } = await removeFromCart([itemId]);

    return {
      success: true,
      cart,
      warnings,
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
    const { cart, warnings } = await updateCart([{ id: itemId, quantity }]);

    return {
      success: true,
      cart,
      warnings,
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
    const { cart, warnings } = await addToCart([{ merchandiseId, quantity }]);

    return {
      success: true,
      cart,
      warnings,
    };
  } catch (error) {
    console.error("Add to cart failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}

export async function syncCartLocaleAction(locale: string): Promise<CartActionResult> {
  if (!isEnabledLocale(locale)) {
    return {
      success: false,
      error: "Unsupported locale",
    };
  }

  try {
    const result = await updateCartBuyerIdentity(locale);

    if (!result) {
      return { success: true };
    }

    return {
      success: true,
      cart: result.cart,
      warnings: result.warnings,
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

    return {
      success: true,
      cart: result?.cart,
      warnings: result?.warnings,
    };
  } catch (error) {
    console.error("Update cart note failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart note",
    };
  }
}

export async function applyDiscountCodeAction(code: string): Promise<CartActionResult> {
  const normalized = normalizeDiscountCode(code);

  if (!normalized) {
    return { success: false, error: "Discount code is required" };
  }
  if (normalized.length > MAX_DISCOUNT_CODE_LENGTH) {
    return { success: false, error: "Discount code is too long" };
  }
  if (!DISCOUNT_CODE_PATTERN.test(normalized)) {
    return { success: false, error: "Discount code contains invalid characters" };
  }

  try {
    // Shopify replaces the entire discount-code set; never fall back to [] after a read failure.
    const current = await getCart();
    if (!current) {
      return { success: false, error: "Cart not found" };
    }

    const existing = current.discountCodes.map((d) => d.code.toUpperCase());
    if (existing.includes(normalized)) {
      return { success: true, cart: current };
    }

    const result = await updateCartDiscountCodes([...existing, normalized]);
    if (!result) {
      return { success: false, error: "Cart not found" };
    }

    // Shopify accepts unknown codes as applicable:false, so undo and reject them.
    const applied = result.cart.discountCodes.find((d) => d.code.toUpperCase() === normalized);
    if (applied && !applied.applicable) {
      const reverted = await updateCartDiscountCodes(existing);
      const errorMessage =
        result.warnings[0]?.message ?? "That discount code can't be applied to this cart";
      return { success: false, cart: reverted?.cart, error: errorMessage };
    }

    return { success: true, cart: result.cart, warnings: result.warnings };
  } catch (error) {
    console.error("Apply discount code failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply discount code",
    };
  }
}

export async function removeDiscountCodeAction(code: string): Promise<CartActionResult> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    return { success: false, error: "Discount code is required" };
  }

  try {
    // The mutation replaces the whole set; a failed read must not wipe other codes.
    const current = await getCart();
    if (!current) {
      return { success: false, error: "Cart not found" };
    }

    const next = current.discountCodes
      .map((d) => d.code)
      .filter((c) => c.toUpperCase() !== normalized);

    const result = await updateCartDiscountCodes(next);
    if (!result) {
      return { success: false, error: "Cart not found" };
    }

    return { success: true, cart: result.cart, warnings: result.warnings };
  } catch (error) {
    console.error("Remove discount code failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove discount code",
    };
  }
}

/** Uses Shopify's cart permalink format (`/cart/{numericId}:{qty}`) — no API cart is created. */
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
