"use client";

import { useCart as useHydrogenCart, useCartForm } from "@shopify/hydrogen/react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Cart } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DiscountFormProps {
  cart: Cart;
}

export function DiscountForm({ cart }: DiscountFormProps) {
  const t = useTranslations("cart");
  const { setWarnings } = useCart();
  const { formProps, register } = useCartForm();
  const discountErrors = useHydrogenCart((state) => state.errors.discountCodes);
  const networkErrors = useHydrogenCart((state) => state.errors.network);
  const pendingDiscountCodes = useHydrogenCart((state) => state.pending.discountCodes);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isPending = pendingDiscountCodes.size > 0;
  const error =
    localError ??
    Array.from(discountErrors.values()).flatMap((group) => group.userErrors)[0]?.message ??
    networkErrors.at(-1)?.message ??
    null;

  return (
    <div className="grid gap-2.5">
      <form
        {...formProps({
          afterSubmit: () => setCode(""),
          beforeSubmit: (event) => {
            if (!code.trim()) {
              event.preventDefault();
              setLocalError(t("discountInvalidCode"));
              return;
            }
            setLocalError(null);
            setWarnings([]);
          },
        })}
        className="flex gap-2.5"
      >
        <Input
          type="text"
          {...register("discountCode", { value: code })}
          onChange={(event) => {
            setCode(event.target.value);
            if (localError) setLocalError(null);
          }}
          placeholder={t("discountCode")}
          aria-label={t("discountCode")}
          aria-invalid={error ? true : undefined}
          disabled={isPending}
          autoComplete="off"
          spellCheck={false}
          className="flex-1"
        />
        <Button {...register("discount-apply")} disabled={isPending || code.trim() === ""}>
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
          {cart.discountCodes.map((discount) => {
            const isCodePending = pendingDiscountCodes.has(discount.code);
            const isInvalid = !discount.applicable && !isCodePending;

            return (
              <li key={discount.code}>
                <form
                  {...formProps({
                    beforeSubmit: () => {
                      setLocalError(null);
                      setWarnings([]);
                    },
                  })}
                >
                  <input type="hidden" {...register("discountCode", { value: discount.code })} />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                      discount.applicable || isCodePending
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border border-input",
                    )}
                  >
                    <span className={cn(isInvalid && "line-through")}>{discount.code}</span>
                    {isInvalid ? (
                      <span className="text-xs uppercase tracking-wide">
                        {t("discountNotApplicable")}
                      </span>
                    ) : null}
                    <button
                      {...register("discount-remove")}
                      aria-label={`${t("removeDiscount")}: ${discount.code}`}
                      disabled={isPending}
                      className={cn(
                        "ml-0.5 inline-flex size-4 items-center justify-center rounded-sm cursor-pointer disabled:cursor-not-allowed",
                        discount.applicable || isCodePending
                          ? "hover:bg-primary-foreground/15"
                          : "hover:bg-foreground/10",
                      )}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
