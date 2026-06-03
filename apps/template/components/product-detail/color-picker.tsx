import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

import { type SelectedOptions, getVariantUrl } from "@/lib/product";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColorPickerProps extends React.ComponentProps<"div"> {
  option: ProductOption;
  selectedValue: string;
  variants: ProductVariant[];
  handle: string;
  selectedOptions: SelectedOptions;
  hideImages?: boolean;
}

export function ColorPicker({
  option,
  selectedValue,
  variants,
  handle,
  selectedOptions,
  hideImages,
  className,
  ...props
}: ColorPickerProps) {
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-2.5">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;

          const isAvailable = variants.some(
            (v) =>
              v.availableForSale &&
              v.selectedOptions.some((opt) => opt.name === option.name && opt.value === value.name),
          );

          const variantImage = variants.find((v) =>
            v.selectedOptions.some((opt) => opt.name === option.name && opt.value === value.name),
          )?.image?.url;

          const imageUrl = hideImages ? undefined : value.swatch?.image || variantImage;

          const href = getVariantUrl(handle, variants, selectedOptions, option.name, value.name);

          const isColorSwatch = !!value.swatch?.color;

          const swatch = (
            <div
              className={cn(
                "aspect-square w-full transition-all overflow-hidden",
                isColorSwatch ? "rounded-full" : "rounded-lg",
                isColorSwatch
                  ? isSelected
                    ? "ring-1 ring-offset-2 ring-foreground/50"
                    : "ring-1 ring-offset-2 ring-transparent"
                  : isSelected
                    ? "ring-1 ring-inset ring-foreground/50"
                    : "ring-1 ring-transparent",
              )}
            >
              {value.swatch?.color ? (
                <div
                  className="size-full rounded-full border border-foreground/10"
                  style={{ backgroundColor: value.swatch.color }}
                  aria-label={`${value.name} (${value.swatch.color})`}
                />
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  width={200}
                  height={200}
                  alt={`${value.name} swatch`}
                  className="size-full rounded-lg border border-foreground/10 object-cover"
                />
              ) : (
                <div className="size-full rounded-lg border border-foreground/10 bg-accent" />
              )}
            </div>
          );

          const label = (
            <span
              className={cn(
                "text-sm font-medium transition-opacity text-center",
                isSelected ? "text-foreground" : "text-foreground/50",
              )}
            >
              {value.name}
            </span>
          );

          if (!isAvailable) {
            return (
              <span
                key={value.id}
                className="flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
                aria-label={`${option.name}: ${value.name} (unavailable)`}
              >
                {swatch}
                {label}
              </span>
            );
          }

          return (
            <Link
              key={value.id}
              href={href}
              scroll={false}
              className="flex flex-col items-center gap-2"
              aria-label={`Select ${option.name}: ${value.name}`}
            >
              {swatch}
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
