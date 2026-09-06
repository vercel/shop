"use client";

import { sanitizeQuantity, type CartFormRegister } from "@shopify/hydrogen";
import { useCartForm } from "@shopify/hydrogen/react";
import type * as React from "react";

interface CartLineFormProps extends Omit<
  React.ComponentProps<"form">,
  "action" | "children" | "method"
> {
  children: (register: CartFormRegister) => React.ReactNode;
  lineId: string;
  maxQuantity?: number;
  minQuantity?: number;
}

export function CartLineForm({
  children,
  lineId,
  maxQuantity = 99,
  minQuantity = 0,
  ...props
}: CartLineFormProps) {
  const { formProps, register } = useCartForm();

  return (
    <form
      {...formProps({
        beforeSubmit: (event) => {
          const input = event.currentTarget.elements.namedItem("quantity");
          if (input instanceof HTMLInputElement) {
            input.value = String(
              sanitizeQuantity(input.value, { max: maxQuantity, min: minQuantity }),
            );
          }
        },
      })}
      {...props}
    >
      <button {...register("set")} />
      <input type="hidden" {...register("lineId", { value: lineId })} />
      {children(register)}
    </form>
  );
}
