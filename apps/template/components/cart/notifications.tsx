"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/context";

export function CartNotifications() {
  const { clearError, lastError } = useCart();
  const t = useTranslations("cart");

  useEffect(() => {
    if (!lastError) return;

    toast.error(t(`errors.${lastError}`), {
      id: `cart-${lastError}`,
      onAutoClose: clearError,
      onDismiss: clearError,
    });
  }, [clearError, lastError, t]);

  return null;
}
