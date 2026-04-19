"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { useCartRender } from "@/components/cart/context-sync";
import { Switch } from "@/components/ui/switch";
import { prepareCheckoutAction, updateCartNoteAction } from "@/lib/cart/action";
import { cn, formatPrice } from "@/lib/utils";

const GIFT_NOTE_MARKER = "🎁 This is a gift";

function CheckoutLink({
  checkoutUrl,
  isUpdatingCart,
  updatingText,
  checkoutText,
}: {
  checkoutUrl: string;
  isUpdatingCart: boolean;
  updatingText: string;
  checkoutText: string;
}) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const baseClassName =
    "flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium bg-foreground text-background transition-colors";

  if (isUpdatingCart || isCheckingOut) {
    return (
      <span className={cn(baseClassName, "opacity-50 cursor-not-allowed")} aria-disabled="true">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{isCheckingOut ? checkoutText : updatingText}</span>
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(baseClassName, "hover:bg-foreground/90 cursor-pointer")}
      onClick={async () => {
        setIsCheckingOut(true);
        const { checkoutUrl: url } = await prepareCheckoutAction();
        window.location.href = url || checkoutUrl;
      }}
    >
      <span>{checkoutText}</span>
    </button>
  );
}

interface SummaryProps {
  locale: string;
}

export function Summary({ locale }: SummaryProps) {
  const t = useTranslations("cart");
  const { setCart, isUpdatingCart } = useCart();
  const cart = useCartRender();
  const [isPending, startTransition] = useTransition();

  const isGiftFromNote = cart?.note?.includes(GIFT_NOTE_MARKER) ?? false;
  const [optimisticIsGift, setOptimisticIsGift] = useOptimistic(isGiftFromNote);

  function handleGiftToggle(checked: boolean) {
    setOptimisticIsGift(checked);
    startTransition(async () => {
      const newNote = checked ? GIFT_NOTE_MARKER : "";
      const result = await updateCartNoteAction(newNote);
      if (result.success && result.cart) {
        setCart(result.cart);
      }
    });
  }

  if (!cart) return null;

  const subtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">{t("estimatedTotal")}</span>
          <span className="text-xl font-medium text-foreground">
            {formatPrice(subtotal, currencyCode, locale)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("taxesAndShippingNote")}</p>

        <div className="flex items-center gap-2.5 mt-5">
          <Switch
            id="gift-toggle"
            checked={optimisticIsGift}
            onCheckedChange={handleGiftToggle}
            disabled={isPending}
          />
          <label htmlFor="gift-toggle" className="text-sm font-medium cursor-pointer">
            {t("isThisAGift")}
          </label>
        </div>
      </div>

      <CheckoutLink
        checkoutUrl={cart.checkoutUrl}
        isUpdatingCart={isUpdatingCart}
        updatingText={t("updatingCart")}
        checkoutText={t("completeCheckout")}
      />
    </div>
  );
}
