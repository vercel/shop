"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/use-checkout";

interface CartCheckoutProps {
  "aria-label"?: string;
  label?: string;
}

export function CartCheckout({ "aria-label": ariaLabel, label = "Checkout" }: CartCheckoutProps) {
  const {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  } = useCheckout();
  return (
    <div className="grid gap-2.5">
      <Button
        aria-busy={isCheckingOut || isUpdatingCart || undefined}
        aria-describedby={checkoutError ? checkoutErrorId : undefined}
        aria-label={ariaLabel}
        className="h-12 w-full justify-center"
        disabled={isCheckoutDisabled}
        onClick={handleCheckout}
        type="button"
      >
        {isCheckingOut || isUpdatingCart ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isCheckingOut ? "Redirecting..." : isUpdatingCart ? "Updating cart..." : label}
      </Button>
      {checkoutError ? (
        <p className="text-xs text-destructive" id={checkoutErrorId} role="alert">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}
