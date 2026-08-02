"use client";

import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SubmitEvent, useState } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyDiscount, removeDiscount } from "@/lib/cart/client";
import type { Cart } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DiscountFormProps {
  cart: Cart;
}

export function DiscountForm({ cart }: DiscountFormProps) {
  const t = useTranslations("cart");
  const { setWarnings } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const existingCodes = cart.discountCodes.map((d) => d.code);

  const handleApply = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t("discountInvalidCode"));
      return;
    }
    setError(null);
    setWarnings([]);
    setIsPending(true);
    applyDiscount(trimmed, existingCodes)
      .then((result) => {
        if (result.error) {
          setError(result.error);
          return;
        }
        setCode("");
      })
      .finally(() => setIsPending(false));
  };

  const handleRemove = (target: string) => {
    setError(null);
    setWarnings([]);
    setIsPending(true);
    removeDiscount(target, existingCodes)
      .then((result) => {
        if (result.error) setError(result.error);
      })
      .finally(() => setIsPending(false));
  };

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
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                  d.applicable
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-input",
                )}
              >
                <span className={cn(!d.applicable && "line-through")}>{d.code}</span>
                {!d.applicable ? (
                  <span className="text-xs uppercase tracking-wide">
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
    </div>
  );
}
