"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart, useCartForm } from "@shopify/hydrogen/react";
import { cn } from "cn";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiscountFormProps {
  cart: CartData;
}

export function DiscountForm({ cart }: DiscountFormProps) {
  const { formProps, register } = useCartForm();
  const discountErrors = useCart((state) => state.errors.discountCodes);
  const pendingDiscountCodes = useCart((state) => state.pending.discountCodes);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isPending = pendingDiscountCodes.size > 0;
  const error =
    localError ??
    Array.from(discountErrors.values()).flatMap((group) => [
      ...group.userErrors,
      ...group.warnings,
    ])[0]?.message ??
    null;
  return (
    <div className="grid gap-2.5">
      <form
        {...formProps({
          afterSubmit: () => setCode(""),
          beforeSubmit: (event) => {
            const normalized = code.trim().toUpperCase();
            if (!normalized) {
              event.preventDefault();
              setLocalError("Enter a valid discount code");
              return;
            }
            if (cart.discountCodes.some((discount) => discount.code.toUpperCase() === normalized)) {
              event.preventDefault();
              return;
            }
            const input = event.currentTarget.elements.namedItem("discountCode");
            if (input instanceof HTMLInputElement) input.value = normalized;
            setLocalError(null);
          },
        })}
        className="flex gap-2.5"
      >
        <Input
          type="text"
          {...register("discountCode", { value: code })}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (localError) setLocalError(null);
          }}
          placeholder="Discount code"
          aria-label="Discount code"
          aria-invalid={error ? true : undefined}
          disabled={isPending}
          autoComplete="off"
          spellCheck={false}
          className="flex-1"
        />
        <Button
          {...register("discount-apply")}
          type="submit"
          disabled={isPending || code.trim() === ""}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Apply"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {cart.discountCodes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Discount">
          {cart.discountCodes.map((discount) => {
            const isCodePending = pendingDiscountCodes.has(discount.code);
            const isInvalid = !discount.applicable && !isCodePending;
            return (
              <li key={discount.code}>
                {/* Hydrogen reads FormData from the native submit event, before a React onClick could populate a shared input. */}
                <form
                  {...formProps({
                    beforeSubmit: () => {
                      setLocalError(null);
                    },
                  })}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                    discount.applicable || isCodePending
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-input",
                  )}
                >
                  <input type="hidden" {...register("discountCode", { value: discount.code })} />
                  <span className={cn(isInvalid && "line-through")}>{discount.code}</span>
                  {isInvalid ? (
                    <span className="text-xs uppercase tracking-wide">Not applicable</span>
                  ) : null}
                  <button
                    {...register("discount-remove")}
                    type="submit"
                    aria-label={`${"Remove discount"}: ${discount.code}`}
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
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
