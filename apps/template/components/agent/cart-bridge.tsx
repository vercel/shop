"use client";

import { useCartActions } from "@shopify/hydrogen/react";
import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { useEffect, useRef } from "react";

function toolNameOf(part: { toolName?: string; type: string }): string {
  return part.type === "dynamic-tool" ? (part.toolName ?? "") : part.type.slice(5);
}

export function AgentCartBridge({ messages }: { messages: readonly UIMessage[] }) {
  const { refresh } = useCartActions();
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
        if (!isToolUIPart(part)) continue;
        const toolName = toolNameOf(part);
        if (toolName !== "getCart") continue;
        if (part.state !== "output-available" || seen.current.has(part.toolCallId)) continue;
        seen.current.add(part.toolCallId);
        if (isReplay) continue;
        const output = part.output as { empty?: boolean } | undefined;
        if (typeof output?.empty === "boolean") shouldRefresh = true;
      }
    }

    if (shouldRefresh) void refresh();
  }, [messages, refresh]);

  return null;
}
