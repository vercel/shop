import { cache } from "react";

import { getCartIdFromCookie, invalidateCartCache, setCartIdCookie } from "@/lib/cart/server";
import { defaultLocale } from "@/lib/i18n";
import type { Cart } from "@/lib/types";

import {
  addToCartCore,
  type CartLineInput,
  type CartMutationResult,
  createCartCore,
  fetchCart,
  removeFromCartCore,
  updateCartCore,
  updateCartNoteCore,
} from "../fetch";

export type { CartLineInput, CartMutationResult };

export const getCart = cache(async (): Promise<Cart | undefined> => {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;
  return getCartById(cartId);
});

export async function getCartById(cartId: string): Promise<Cart | undefined> {
  return fetchCart(cartId);
}

// Streaming callers must emit the cart cookie through response headers.
export async function createCartWithoutCookie(
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  const result = await createCartCore(locale);
  invalidateCartCache();
  return result;
}

export async function createCart(locale: string = defaultLocale): Promise<CartMutationResult> {
  const result = await createCartWithoutCookie(locale);

  if (result.cart.id) {
    await setCartIdCookie(result.cart.id);
  }

  return result;
}

export async function addToCart(
  lines: CartLineInput[],
  cartId?: string,
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  let resolvedCartId = cartId ?? (await getCartIdFromCookie());
  if (!resolvedCartId) {
    resolvedCartId = (await createCart(locale)).cart.id;
  }
  if (!resolvedCartId) throw new Error("Cart ID not found");

  const result = await addToCartCore(lines, resolvedCartId);
  invalidateCartCache();
  return result;
}

export async function updateCart(
  lines: { id: string; quantity: number }[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const result = await updateCartCore(lines, cartId);
  invalidateCartCache();
  return result;
}

export async function removeFromCart(
  lineIds: string[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const result = await removeFromCartCore(lineIds, cartId);
  invalidateCartCache();
  return result;
}

export async function updateCartNote(
  note: string,
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  const result = await updateCartNoteCore(note, cartId);
  invalidateCartCache();
  return result;
}
