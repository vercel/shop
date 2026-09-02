import { io } from "next/cache";
import { cache } from "react";

import { getCartIdFromCookie } from "@/lib/cart/server";
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

// Carts are never put in the Next.js data cache — only this per-request memoization.
export const getCart = cache(async (): Promise<Cart | undefined> => {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;
  return getCartById(cartId);
});

export async function getCartById(cartId: string): Promise<Cart | undefined> {
  // Hydrogen's request context calls crypto.randomUUID(); exclude the cart read from the static shell.
  await io();
  return fetchCart(cartId);
}

// Callers persist the id with Hydrogen's createCartCookie on their own response.
export async function createCart(locale: string = defaultLocale): Promise<CartMutationResult> {
  return createCartCore(locale);
}

export async function addToCart(
  lines: CartLineInput[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  return addToCartCore(lines, cartId);
}

export async function updateCart(
  lines: { id: string; quantity: number }[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  return updateCartCore(lines, cartId);
}

export async function removeFromCart(
  lineIds: string[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  return removeFromCartCore(lineIds, cartId);
}

export async function updateCartNote(
  note: string,
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  return updateCartNoteCore(note, cartId);
}
