"use client";

import { useCart } from "@shopify/hydrogen/react";
import { useEffect } from "react";
import { toast } from "sonner";

export function CartNotifications() {
  const hasNetworkErrors = useCart((state) => state.errors.network.length > 0);
  const updatedAt = useCart((state) => state.errors.networkUpdatedAt);

  useEffect(() => {
    if (!hasNetworkErrors) return;
    toast.error("We couldn't update your cart. Please try again.", {
      id: `cart-network-${updatedAt}`,
    });
  }, [hasNetworkErrors, updatedAt]);

  return null;
}
