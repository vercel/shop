"use client";

import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColorPickerProps extends ComponentPropsWithoutRef<"div"> {
  option: ProductOption;
  selectedValue: string;
  variants: ProductVariant[];
  onValueChange: (value: string) => void;
}

export function ColorPicker({
  option,
  selectedValue,
  variants,
  onValueChange,
  className,
  ...props
}: ColorPickerProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="grid grid-cols-5 gap-3">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;

          const isAvailable = variants.some(
            (v) =>
              v.availableForSale &&
              v.selectedOptions.some(
                (opt) => opt.name === option.name && opt.value === value.name,
              ),
          );

          const variantImage = variants.find((v) =>
            v.selectedOptions.some(
              (opt) => opt.name === option.name && opt.value === value.name,
            ),
          )?.image?.url;

          const imageUrl = value.swatch?.image || variantImage;

          return (
            <button
              key={value.id}
              type="button"
              onClick={() => onValueChange(value.name)}
              disabled={!isAvailable}
              data-selected={isSelected}
              className={cn(
                "flex flex-col items-center gap-2",
                !isAvailable && "opacity-40 cursor-not-allowed",
              )}
              aria-label={`Select ${option.name}: ${value.name}`}
            >
              <div
                className={cn(
                  "aspect-square w-full rounded-lg transition-all overflow-hidden",
                  isSelected
                    ? "ring-1 ring-inset ring-foreground/50"
                    : "ring-1 ring-transparent",
                )}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    width={200}
                    height={200}
                    alt={`${value.name} swatch`}
                    className="size-full rounded-lg border border-foreground/10 object-cover"
                  />
                ) : (
                  <div
                    className="size-full rounded-lg border border-foreground/10"
                    style={
                      value.swatch?.color
                        ? { backgroundColor: value.swatch.color }
                        : undefined
                    }
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-opacity",
                  isSelected ? "text-foreground" : "text-foreground/50",
                )}
              >
                {value.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
