"use client";

import { useCartActions } from "@shopify/hydrogen/react";
import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { useEffect, useRef } from "react";

import { useCartDrawer } from "@/components/cart/context";

const MUTATION_TOOLS = new Set(["addCartNote", "addToCart", "updateCartItem"]);

function toolNameOf(part: { toolName?: string; type: string }): string {
  return part.type === "dynamic-tool" ? (part.toolName ?? "") : part.type.slice(5);
}

export function AgentCartBridge({ messages }: { messages: readonly UIMessage[] }) {
  const { refresh } = useCartActions();
  const { openOverlay } = useCartDrawer();
  const seen = useRef<Set<string>>(new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    // Restored conversations must not replay old mutations.
    const isReplay = !hydrated.current;
    hydrated.current = true;
    let shouldRefresh = false;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolUIPart(part) || !MUTATION_TOOLS.has(toolNameOf(part))) continue;
        if (part.state !== "output-available" || seen.current.has(part.toolCallId)) continue;
        seen.current.add(part.toolCallId);
        if (isReplay) continue;
        const output = part.output as { cartUpdated?: boolean } | undefined;
        if (output?.cartUpdated === true) shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      void refresh();
      openOverlay();
    }
  }, [messages, openOverlay, refresh]);

  return null;
}
