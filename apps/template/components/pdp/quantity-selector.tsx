"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps extends ComponentPropsWithoutRef<"div"> {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  stock?: number;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  max = 99,
  stock,
  className,
  ...props
}: QuantitySelectorProps) {
  const t = useTranslations("product");

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <span className="text-sm text-foreground/60">{t("quantity")}:</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          aria-label={t("decreaseQuantity")}
        >
          <MinusIcon className="size-3.5" />
        </Button>
        <NativeSelect
          value={quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          className="rounded-full bg-muted border-0 min-w-17.5 h-8 pr-5"
          size="sm"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
            <NativeSelectOption key={num} value={num}>
              {num}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full"
          onClick={() => onQuantityChange(Math.min(max, quantity + 1))}
          disabled={quantity >= max}
          aria-label={t("increaseQuantity")}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>
      {stock !== undefined && (
        <span className="text-sm text-foreground/50">
          {t("stockLeft", { stock: String(stock) })}
        </span>
      )}
    </div>
  );
}
