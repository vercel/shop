"use client";

import { useCart, useCartActions } from "@shopify/hydrogen/react";
import type { EveMessage } from "eve/react";
import { useEffect, useRef } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { setAgentCartPending } from "@/lib/agent/cart/client";
import { getCartMutationResult } from "@/lib/agent/commerce";

export function AgentCartBridge({
  messages,
  status,
}: {
  messages: readonly EveMessage[];
  status: string;
}) {
  const { refresh } = useCartActions();
  const cart = useCart((state) => state);
  const { openOverlay } = useCartDrawer();
  const seen = useRef(new Set<string>());
  const hydrated = useRef(false);
  const refreshing = useRef(false);
  const observedLoading = useRef(false);
  const shouldOpen = useRef(false);
  const busy = status === "submitted" || status === "streaming" || status === "resuming";
  useEffect(() => {
    setAgentCartPending(true);
    let cartChanged = false;
    for (const message of messages)
      for (const part of message.parts) {
        if (
          part.type !== "dynamic-tool" ||
          part.state !== "output-available" ||
          part.partial ||
          seen.current.has(part.toolCallId)
        )
          continue;
        seen.current.add(part.toolCallId);
        if (hydrated.current && getCartMutationResult(part)) cartChanged = true;
      }
    if (!busy) hydrated.current = true;
    if (busy && !cartChanged) return;
    if (cartChanged) shouldOpen.current = true;
    refreshing.current = true;
    observedLoading.current = false;
    refresh();
  }, [busy, messages, refresh]);
  useEffect(() => {
    if (!refreshing.current) return;
    if (cart.loading || cart.revalidating) {
      observedLoading.current = true;
      return;
    }
    if (!observedLoading.current || cart.errors.network.length) return;
    refreshing.current = false;
    if (!busy) setAgentCartPending(false);
    if (shouldOpen.current) {
      shouldOpen.current = false;
      openOverlay();
    }
  }, [busy, cart, openOverlay]);
  return null;
}
