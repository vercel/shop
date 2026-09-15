"use client";

import { useCart, useCartActions } from "@shopify/hydrogen/react";
import type { EveMessage } from "eve/react";
import { useEffect, useLayoutEffect, useRef } from "react";

import { getCartMutationResult, isCartMutation } from "@/lib/agent/cart";
import {
  getAgentCartStatus,
  setAgentCartStatus,
  useAgentCartStatus,
} from "@/lib/agent/cart/client";

export function AgentCartBridge({
  messages,
  status,
}: {
  messages: readonly EveMessage[];
  status: string;
}) {
  const { refresh } = useCartActions();
  const cart = useCart((state) => state);
  const seen = useRef(new Set<string>());
  const touched = useRef(new Set<string>());
  const hydrated = useRef(false);
  const refreshing = useRef(false);
  const observedLoading = useRef(false);
  const previousNetworkErrorAt = useRef(0);
  const cartStatus = useAgentCartStatus();
  const busy = status === "submitted" || status === "streaming" || status === "resuming";
  // Interrupted or errored cart writes may have landed, so any cart tool call forces a refresh at settle.
  useLayoutEffect(() => {
    let confirmed = false;
    for (const message of messages)
      for (const part of message.parts) {
        if (part.type !== "dynamic-tool" || seen.current.has(part.toolCallId)) continue;
        const settled =
          (part.state === "output-available" && !part.partial) || part.state === "output-error";
        if (settled) seen.current.add(part.toolCallId);
        if (!isCartMutation(part.toolName) || (!hydrated.current && !busy)) continue;
        touched.current.add(part.toolCallId);
        if (settled && getCartMutationResult(part)) confirmed = true;
      }
    if (!busy) hydrated.current = true;
    if (!confirmed && (busy || !touched.current.size)) {
      if (!busy && !refreshing.current && getAgentCartStatus() === "pending")
        setAgentCartStatus("ready");
      return;
    }
    touched.current.clear();
    refreshing.current = true;
    observedLoading.current = false;
    setAgentCartStatus("pending");
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
  }, [busy, cart]);
  if (busy || cartStatus === "ready") return null;
  if (cartStatus === "pending" || cart.loading || cart.revalidating)
    return (
      <p role="status" className="px-2.5 py-2 text-muted-foreground text-xs">
        Confirming your cart…
      </p>
    );
  return (
    <div role="alert" className="grid gap-2.5 px-2.5 py-2 text-red-500 text-xs">
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
