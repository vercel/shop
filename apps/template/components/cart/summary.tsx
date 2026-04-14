"use client";

import { ArrowRightIcon, InfoIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn, formatPrice } from "@/lib/utils";

import { prepareCheckoutAction, updateCartNoteAction } from "./actions";
import { useCart } from "./context";
import { useCartRender } from "./context-sync";

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
    "flex items-center justify-between w-full bg-primary text-primary-foreground font-medium py-4 px-6 transition-colors";

  if (isUpdatingCart || isCheckingOut) {
    return (
      <span className={cn(baseClassName, "opacity-50 cursor-not-allowed")} aria-disabled="true">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{isCheckingOut ? checkoutText : updatingText}</span>
        </span>
        <span className="size-8" />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(baseClassName, "hover:bg-primary/90 cursor-pointer")}
      onClick={async () => {
        setIsCheckingOut(true);
        const { checkoutUrl: url } = await prepareCheckoutAction();
        window.location.href = url || checkoutUrl;
      }}
    >
      <span>{checkoutText}</span>
      <span className="flex items-center justify-center size-8 rounded-full bg-white/20">
        <ArrowRightIcon className="size-4" />
      </span>
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
  const itemCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const tax = cart.cost.totalTaxAmount ? parseFloat(cart.cost.totalTaxAmount.amount) : 0;
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden py-0 gap-0">
        <CardContent className="px-6 pt-6 pb-4 space-y-3">
          <h2 className="text-lg font-semibold">{t("orderTotal")}</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("items")} ({itemCount})
              </span>
              <span>{formatPrice(subtotal, currencyCode, locale)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("estimatedTax")}</span>
              <span>{formatPrice(tax, currencyCode, locale)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-4 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <Switch
              id="gift-toggle"
              checked={optimisticIsGift}
              onCheckedChange={handleGiftToggle}
              disabled={isPending}
            />
            <div className="flex-1">
              <label htmlFor="gift-toggle" className="text-sm font-medium cursor-pointer">
                {t("isThisAGift")}
              </label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
              >
                <InfoIcon className="size-3" />
                {t("moreInfo")}
              </button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <CheckoutLink
        checkoutUrl={cart.checkoutUrl}
        isUpdatingCart={isUpdatingCart}
        updatingText={t("updatingCart")}
        checkoutText={t("completeCheckout")}
      />
    </div>
  );
}
