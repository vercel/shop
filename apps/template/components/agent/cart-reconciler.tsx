"use client";

import type { EveMessage } from "eve/react";
import { useEffect, useRef } from "react";

import { persistAgentCartAction } from "@/lib/cart/action";

import { useCart } from "../cart/context";

/** Tool names (snake_case, matching agent/tools/*.ts) that return an updated cart. */
const CART_TOOL_NAMES = new Set([
  "add_to_cart",
  "update_cart_item_quantity",
  "remove_from_cart",
  "add_cart_note",
  "get_cart",
]);

/**
 * Watches for cart-related tool results in agent messages and updates the cart context.
 * This enables instant cart updates without page refresh when the agent modifies the cart.
 */
export function CartReconciler({ messages }: { messages: readonly EveMessage[] }) {
  const { setCart, openOverlay } = useCart();
  const processedToolCalls = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      for (const message of messages) {
        if (message.role !== "assistant") continue;
        for (const part of message.parts) {
          if (part.type === "dynamic-tool") {
            processedToolCalls.current.add(part.toolCallId);
          }
        }
      }
      initialized.current = true;
      return;
    }

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (part.type !== "dynamic-tool") continue;

        const toolName = part.toolName;
        if (!CART_TOOL_NAMES.has(toolName)) continue;

        if (part.state === "output-available" && !processedToolCalls.current.has(part.toolCallId)) {
          processedToolCalls.current.add(part.toolCallId);

          const result = part.output as
            | { success: true; cart?: unknown; createdCartId?: string }
            | { success: false };

          if (result?.success && "cart" in result && result.cart) {
            // oxlint-disable-next-line typescript/no-explicit-any -- Tool result is typed loosely
            setCart(result.cart as any);

            // A cart the agent created in eve's runtime has no cookie yet; persist it.
            if ("createdCartId" in result && result.createdCartId) {
              void persistAgentCartAction(result.createdCartId);
            }

            // Don't open overlay for get_cart (read-only), only for mutations.
            if (toolName !== "get_cart") {
              openOverlay();
            }
          }
        }
      }
    }
  }, [messages, setCart, openOverlay]);

  return null;
}
