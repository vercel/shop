"use client";

import { useCart, useCartActions } from "@shopify/hydrogen/react";
import type { EveMessage } from "eve/react";
import { useEffect, useRef } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { getCartMutationResult } from "@/lib/agent/cart";
import { setAgentCartStatus, useAgentCartStatus } from "@/lib/agent/cart/client";

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
  const previousNetworkErrorAt = useRef(0);
  const shouldOpen = useRef(false);
  const cartStatus = useAgentCartStatus();
  const busy = status === "submitted" || status === "streaming" || status === "resuming";
  useEffect(() => {
    setAgentCartStatus("pending");
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
      setAgentCartStatus("pending");
      observedLoading.current = true;
      previousNetworkErrorAt.current = cart.errors.networkUpdatedAt;
      return;
    }
    if (!observedLoading.current) return;
    // Hydrogen retains network errors from unrelated mutations across refreshes.
    if (
      cart.errors.network.length &&
      cart.errors.networkUpdatedAt > previousNetworkErrorAt.current
    ) {
      setAgentCartStatus("failed");
      return;
    }
    refreshing.current = false;
    if (!busy) setAgentCartStatus("ready");
    if (shouldOpen.current) {
      shouldOpen.current = false;
      openOverlay();
    }
  }, [busy, cart, openOverlay]);
  if (busy || cartStatus === "ready") return null;
  if (cartStatus === "pending" || cart.loading || cart.revalidating)
    return (
      <p role="status" className="px-5 py-2 text-muted-foreground text-xs">
        Confirming your cart…
      </p>
    );
  return (
    <div role="alert" className="grid gap-2.5 px-5 py-2 text-red-500 text-xs">
      <p>
        We couldn't confirm your cart. Refresh it before checking out or requesting another change.
      </p>
      <button
        className="w-fit cursor-pointer underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={cart.loading || cart.revalidating}
        onClick={() => {
          setAgentCartStatus("pending");
          refreshing.current = true;
          observedLoading.current = false;
          refresh();
        }}
        type="button"
      >
        {cart.loading || cart.revalidating ? "Refreshing…" : "Refresh cart"}
      </button>
    </div>
  );
}
