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
      if (result.cart) setCart(result.cart);
      if (result.success) {
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
      <form onSubmit={handleApply} className="flex gap-2.5">
        <Input
          type="text"
          name="discountCode"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("discountCode")}
          aria-label={t("discountCode")}
          aria-invalid={error ? true : undefined}
          disabled={isPending}
          autoComplete="off"
          spellCheck={false}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || code.trim() === ""}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            t("applyDiscount")
          )}
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
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                  d.applicable
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-input",
                )}
              >
                <span className={cn(!d.applicable && "line-through")}>{d.code}</span>
                {!d.applicable ? (
                  <span className="text-[10px] uppercase tracking-wide">
                    {t("discountNotApplicable")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleRemove(d.code)}
                  aria-label={`${t("removeDiscount")}: ${d.code}`}
                  disabled={isPending}
                  className={cn(
                    "ml-0.5 inline-flex size-4 items-center justify-center rounded-sm cursor-pointer disabled:cursor-not-allowed",
                    d.applicable ? "hover:bg-primary-foreground/15" : "hover:bg-foreground/10",
                  )}
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
          <span className="tabular-nums text-foreground">
            <span aria-hidden="true">−</span>
            <Price
              amount={totalDiscount.amount}
              currencyCode={totalDiscount.currencyCode}
              locale={locale}
              className="inline text-sm"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}
