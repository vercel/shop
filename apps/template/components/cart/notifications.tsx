"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/context";

const CART_ERRORS = {
  add: "We couldn't add that item. Please try again.",
  remove: "We couldn't remove that item. Please try again.",
  update: "We couldn't update that quantity. Please try again.",
};

export function CartNotifications() {
  const { clearError, lastError } = useCart();
  useEffect(() => {
    if (!lastError) return;
    toast.error(CART_ERRORS[lastError], {
      id: `cart-${lastError}`,
      onAutoClose: clearError,
      onDismiss: clearError,
    });
  }, [clearError, lastError]);
  return null;
}
