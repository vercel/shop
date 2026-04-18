import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { type SelectedOptions, getVariantUrl } from "@/lib/product";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OptionPickerProps extends ComponentPropsWithoutRef<"div"> {
  option: ProductOption;
  selectedValue: string;
  variants: ProductVariant[];
  handle: string;
  selectedOptions: SelectedOptions;
}

export function OptionPicker({
  option,
  selectedValue,
  variants,
  handle,
  selectedOptions,
  className,
  ...props
}: OptionPickerProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;

          const isAvailable = variants.some(
            (v) =>
              v.availableForSale &&
              v.selectedOptions.some((opt) => opt.name === option.name && opt.value === value.name),
          );

          const href = getVariantUrl(handle, variants, selectedOptions, option.name, value.name);

          const classes = cn(
            "px-4 py-2 text-sm font-medium rounded-lg border transition-all",
            isSelected
              ? "border-foreground text-foreground"
              : "border-border text-foreground/50 hover:border-foreground/50",
            !isAvailable && "opacity-40 cursor-not-allowed line-through",
          );

          if (!isAvailable) {
            return (
              <span key={value.id} className={classes}>
                {value.name}
              </span>
            );
          }

          return (
            <Link key={value.id} href={href} scroll={false} className={classes}>
              {value.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
