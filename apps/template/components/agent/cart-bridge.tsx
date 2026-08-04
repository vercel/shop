"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { useEffect, useRef } from "react";

import { applyServerCart, type ServerCart } from "@/lib/cart/client";

import { useCart } from "../cart/context";

type CartToolOutput = {
  added?: boolean;
  cart?: ServerCart | null;
  lines?: { lineId: string; quantity: number; variantId: string }[];
  removed?: boolean;
  updated?: boolean;
};

const MUTATION_TOOLS = new Set(["addCartNote", "addToCart", "updateCartItem"]);
const CART_TOOLS = new Set([...MUTATION_TOOLS, "getCart"]);

function toolNameOf(part: { toolName?: string; type: string }): string {
  return part.type === "dynamic-tool" ? (part.toolName ?? "") : part.type.slice(5);
}

/**
 * Syncs carts the assistant mutated server-side into the client cart store, so the cart
 * overlay, badge, and agent cart summary all read the same state.
 */
export function AgentCartBridge({ messages }: { messages: readonly UIMessage[] }) {
  const { openOverlay } = useCart();
  const seen = useRef<Set<string>>(new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    // Restored conversations replay old tool calls; mark them seen without re-applying.
    const isReplay = !hydrated.current;
    hydrated.current = true;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        const toolName = toolNameOf(part);
        if (!CART_TOOLS.has(toolName)) continue;
        if (part.state !== "output-available" || seen.current.has(part.toolCallId)) continue;

        seen.current.add(part.toolCallId);
        if (isReplay) continue;

        const output = part.output as CartToolOutput | undefined;
        if (!output?.cart) continue;

        const action = output.removed ? "remove" : output.added ? "add" : "update";
        applyServerCart(
          action,
          output.cart,
          (output.lines ?? []).map((line) => ({ id: line.lineId, quantity: line.quantity })),
        );
        if (MUTATION_TOOLS.has(toolName)) openOverlay();
      }
    }
  }, [messages, openOverlay]);

  return null;
}
