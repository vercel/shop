"use client";

import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { Price } from "@/components/product/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartDiscountAmount } from "@/lib/cart";
import { applyDiscountCodeAction, removeDiscountCodeAction } from "@/lib/cart/action";
import type { Cart, Money } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DiscountFormProps {
  cart: Cart;
  locale: string;
}

function discountTotal(cart: Cart): Money | null {
  const amount = cartDiscountAmount(cart);
  if (amount === 0) return null;
  return {
    amount: amount.toString(),
    currencyCode: cart.discountAllocations[0].discountedAmount.currencyCode,
  };
}

export function DiscountForm({ cart, locale }: DiscountFormProps) {
  const t = useTranslations("cart");
  const { setCart, setWarnings } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t("discountInvalidCode"));
      return;
    }

    startTransition(async () => {
      const result = await applyDiscountCodeAction(trimmed);
      if (result.success && result.cart) {
        setCart(result.cart);
        setWarnings(result.warnings ?? []);
        setCode("");
      } else {
        setError(result.error ?? t("discountInvalidCode"));
      }
    });
  };

  const handleRemove = (target: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeDiscountCodeAction(target);
      if (result.success && result.cart) {
        setCart(result.cart);
        setWarnings(result.warnings ?? []);
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  const totalDiscount = discountTotal(cart);

  return (
    <div className="grid gap-2.5">
      <form onSubmit={handleApply} className="flex gap-2">
        <Input
          type="text"
          name="discountCode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("discountCode")}
          aria-label={t("discountCode")}
          aria-invalid={error ? true : undefined}
          disabled={isPending}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" variant="outline" size="sm" disabled={isPending || code.trim() === ""}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : t("applyDiscount")}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {cart.discountCodes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("discount")}>
          {cart.discountCodes.map((d) => (
            <li key={d.code}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                  d.applicable
                    ? "border-foreground/20 bg-secondary text-secondary-foreground"
                    : "border-muted bg-muted text-muted-foreground line-through",
                )}
              >
                <span>{d.code}</span>
                {!d.applicable ? (
                  <span className="no-underline text-[10px] uppercase tracking-wide">
                    {t("discountNotApplicable")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleRemove(d.code)}
                  aria-label={`${t("removeDiscount")}: ${d.code}`}
                  disabled={isPending}
                  className="ml-0.5 inline-flex size-4 items-center justify-center rounded-sm hover:bg-foreground/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {totalDiscount ? (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{t("discount")}</span>
          <span className="text-foreground tabular-nums">
            <span aria-hidden="true">−</span>
            <Price
              amount={totalDiscount.amount}
              currencyCode={totalDiscount.currencyCode}
              locale={locale}
              className="inline"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}
