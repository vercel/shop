"use client";

import { useCart } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

export function CartNotifications() {
  const t = useTranslations("cart");
  const hasNetworkErrors = useCart((state) => state.errors.network.length > 0);
  const updatedAt = useCart((state) => state.errors.networkUpdatedAt);

  useEffect(() => {
    if (!hasNetworkErrors) return;
    toast.error(t("errors.update"), {
      id: `cart-network-${updatedAt}`,
    });
  }, [hasNetworkErrors, updatedAt, t]);

  return null;
}
