"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { useEffect, useRef } from "react";

import { useCart } from "../cart/context";

const CART_TOOL_NAMES = new Set([
  "addCartNote",
  "addToCart",
  "getCart",
  "removeFromCart",
  "updateCartItemQuantity",
]);

export function CartReconciler({ messages }: { messages: readonly UIMessage[] }) {
  const { openOverlay, setCart } = useCart();
  const processedToolCalls = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      for (const message of messages) {
        for (const part of message.parts) {
          if (isToolUIPart(part)) processedToolCalls.current.add(part.toolCallId);
        }
      }
      initialized.current = true;
      return;
    }

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        const toolName = part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
        if (!CART_TOOL_NAMES.has(toolName)) continue;
        if (part.state !== "output-available" || processedToolCalls.current.has(part.toolCallId)) {
          continue;
        }
        processedToolCalls.current.add(part.toolCallId);
        const result = part.output as { cart?: unknown; success?: boolean };
        if (!result?.success || !result.cart) continue;
        // oxlint-disable-next-line typescript/no-explicit-any -- Tool results are validated server-side.
        setCart(result.cart as any);
        if (toolName !== "getCart") openOverlay();
      }
    }
  }, [messages, openOverlay, setCart]);

  return null;
}
