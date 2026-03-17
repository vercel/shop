"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { useCart } from "../cart/context";

/** Tool names that return an updated cart object in their results. */
const CART_TOOL_NAMES = new Set([
  "addToCart",
  "updateCartItemQuantity",
  "removeFromCart",
  "addCartNote",
  "getCart",
]);

/**
 * Watches for cart-related tool results in agent messages and updates the cart context.
 * This enables instant cart updates without page refresh when the agent modifies the cart.
 */
export function CartReconciler({ messages }: { messages: UIMessage[] }) {
  const { setCart, openOverlay } = useCart();
  const processedToolCalls = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      for (const message of messages) {
        if (message.role !== "assistant") continue;

        for (const part of message.parts) {
          if ("toolCallId" in part && "state" in part) {
            processedToolCalls.current.add(part.toolCallId as string);
          }
        }
      }

      initialized.current = true;
      return;
    }

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        // Check if this part is a cart-modifying tool call
        const toolName =
          part.type === "dynamic-tool" && "toolName" in part
            ? (part.toolName as string)
            : part.type.startsWith("tool-")
              ? part.type.slice(5)
              : null;

        if (!toolName || !CART_TOOL_NAMES.has(toolName)) continue;

        if ("toolCallId" in part && "state" in part) {
          const toolCallId = part.toolCallId as string;

          // Only process each tool call once, and only when output is available
          if (part.state === "output-available" && !processedToolCalls.current.has(toolCallId)) {
            processedToolCalls.current.add(toolCallId);

            const result = (part as { output: unknown }).output as
              | { success: true; cart: unknown }
              | { success: false };

            if (result?.success && "cart" in result) {
              // oxlint-disable-next-line typescript/no-explicit-any -- Tool result is typed loosely
              setCart(result.cart as any);
              // Don't open overlay for getCart (read-only), only for mutations
              if (toolName !== "getCart") {
                openOverlay();
              }
            }
          }
        }
      }
    }
  }, [messages, setCart, openOverlay]);

  return null;
}
