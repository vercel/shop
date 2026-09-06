"use client";

import { useCart } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { prepareCheckoutAction } from "@/lib/cart/action";

export function useCheckout() {
  const t = useTranslations("cart");
  const cartState = useCart((state) => state);
  const { data: cart, loading, pending, revalidating } = cartState;
  const isUpdatingCart = Boolean(
    loading ||
    revalidating ||
    pending.attributes ||
    pending.cost ||
    pending.discountCodes.size ||
    pending.lines.size ||
    pending.note,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutErrorId = useId();
  const attempt = useRef<object | null>(null);
  const latestCartState = useRef(cartState);
  const isCheckoutDisabled = isUpdatingCart || isCheckingOut || !cart.lines.nodes.length;

  useLayoutEffect(() => {
    latestCartState.current = cartState;
    if (attempt.current && isUpdatingCart) {
      attempt.current = null;
      setIsCheckingOut(false);
      setCheckoutError(t("checkoutChangedPending"));
    }
  }, [cartState, isUpdatingCart, t]);

  useEffect(() => {
    const resetCheckout = () => {
      attempt.current = null;
      setIsCheckingOut(false);
      setCheckoutError(null);
    };
    window.addEventListener("pageshow", resetCheckout);
    return () => {
      attempt.current = null;
      window.removeEventListener("pageshow", resetCheckout);
    };
  }, []);

  async function handleCheckout() {
    if (isCheckoutDisabled || attempt.current) return;
    const currentAttempt = {};
    attempt.current = currentAttempt;
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const { checkoutUrl } = await prepareCheckoutAction();
      if (attempt.current !== currentAttempt) return;
      if (latestCartState.current.data !== cart) {
        setCheckoutError(t("checkoutChanged"));
      } else if (!checkoutUrl) {
        setCheckoutError(t("checkoutUnavailable"));
      } else {
        window.location.href = checkoutUrl;
        return;
      }
    } catch {
      if (attempt.current !== currentAttempt) return;
      setCheckoutError(t("checkoutFailed"));
    }

    attempt.current = null;
    setIsCheckingOut(false);
  }

  return {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  };
}
