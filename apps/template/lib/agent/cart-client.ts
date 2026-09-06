"use client";

import type { CartUserError } from "@shopify/hydrogen";

import type { Cart, CartWarning } from "@/lib/cart";

import { addCartNoteInputSchema, addToCartInputSchema, updateCartItemInputSchema } from "./cart";

const ENDPOINT = "/api/cart";
const TIMEOUT_MS = 10_000;
const UNCONFIRMED_MESSAGE =
  "The cart update could not be confirmed. Read the cart before trying again; the change may have been applied.";

interface CartMutationResponse {
  cart: Cart | null;
  userErrors?: CartUserError[];
  warnings?: CartWarning[];
}

type CartToolResult = { cartUpdated: true; warnings: string[] } | { error: string };

type CartMutation =
  | {
      action: "add";
      lines: { merchandiseId: string; quantity: number }[];
    }
  | {
      action: "remove" | "update";
      lines: { id: string; quantity: number }[];
    }
  | { note: string };

export function isCartMutationTool(name: string): boolean {
  return name === "addToCart" || name === "updateCartItem" || name === "addCartNote";
}

function parseMutation(toolName: string, input: unknown): CartMutation {
  switch (toolName) {
    case "addToCart": {
      const { quantity, variantId } = addToCartInputSchema.parse(input);
      return { action: "add", lines: [{ merchandiseId: variantId, quantity }] };
    }
    case "updateCartItem": {
      const { lineId, quantity } = updateCartItemInputSchema.parse(input);
      return {
        action: quantity === 0 ? "remove" : "update",
        lines: [{ id: lineId, quantity }],
      };
    }
    case "addCartNote":
      return addCartNoteInputSchema.parse(input);
    default:
      throw new Error("Unsupported cart tool.");
  }
}

async function postCart(mutation: CartMutation) {
  const payload = "lines" in mutation ? { lines: mutation.lines } : { note: mutation.note };
  const response = await fetch(ENDPOINT, {
    body: JSON.stringify(payload),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(UNCONFIRMED_MESSAGE);

  const { cart, userErrors, warnings } = (await response.json()) as CartMutationResponse;
  if (!cart) {
    return {
      cart: null,
      userErrors: userErrors?.length ? userErrors : [{ message: UNCONFIRMED_MESSAGE }],
      warnings,
    };
  }
  if (!cart.id || !Array.isArray(cart.lines?.nodes)) throw new Error(UNCONFIRMED_MESSAGE);

  const { lines, ...cartData } = cart;
  return { cart: { ...cartData, lines: lines.nodes }, userErrors, warnings };
}

function dispatchMutation(mutation: CartMutation, promise: ReturnType<typeof postCart>) {
  const eventName = "lines" in mutation ? "shopify:cart:lines-update" : "shopify:cart:note-update";
  const event = Object.assign(new Event(eventName, { bubbles: true, cancelable: true }), {
    ...mutation,
    context: "cart" as const,
    promise,
  });
  document.dispatchEvent(event);
}

export async function executeCartTool(toolName: string, input: unknown): Promise<CartToolResult> {
  if (!isCartMutationTool(toolName)) return { error: "Unsupported cart tool." };

  let mutation: CartMutation;
  try {
    mutation = parseMutation(toolName, input);
  } catch {
    return { error: "Invalid cart tool input. Check the item ID, quantity, or note." };
  }

  if (typeof document === "undefined") return { error: "Cart updates require the storefront." };

  try {
    const promise = postCart(mutation);
    // Hydrogen registers synchronous settlement handlers during dispatch, before our await continuation.
    dispatchMutation(mutation, promise);
    const result = await promise;
    if (result.userErrors?.length) {
      return { error: result.userErrors.map(({ message }) => message).join("; ") };
    }
    if (!result.cart) return { error: UNCONFIRMED_MESSAGE };
    return {
      cartUpdated: true,
      warnings: result.warnings?.map(({ message }) => message) ?? [],
    };
  } catch {
    return { error: UNCONFIRMED_MESSAGE };
  }
}
