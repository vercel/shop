"use client";

import type { getTranslations } from "next-intl/server";
import Link from "next/link";
import type * as React from "react";

import { useVariantSelection } from "@/components/product-detail/variant-selection-client";
import { Swatch } from "@/components/ui/swatch";
import { buildOptionUrl, type SelectedOptions } from "@/lib/product";
import type { ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProductTranslator = Awaited<ReturnType<typeof getTranslations<"product">>>;

interface ColorPickerProps extends React.ComponentProps<"div"> {
  option: ProductOption;
  selectedValue: string;
  available: Set<string> | undefined;
  handle: string;
  selectedOptions: SelectedOptions;
  t: ProductTranslator;
  hideImages?: boolean;
}

export function ColorPicker({
  option,
  selectedValue,
  available,
  handle,
  selectedOptions,
  t,
  hideImages,
  className,
  ...props
}: ColorPickerProps) {
  const optimisticSelection = useVariantSelection();
  const currentOptions = optimisticSelection.optimisticOptions ?? selectedOptions;
  const currentValue = currentOptions[option.name] ?? selectedValue;

  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{currentValue}</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {option.values.map((value) => {
          const isSelected = currentValue === value.name;
          const isAvailable = !available || available.has(value.name);
          const imageUrl = hideImages
            ? undefined
            : value.swatch?.image || (value.swatch?.color ? undefined : value.image);
          const href = buildOptionUrl(handle, selectedOptions, option.name, value.name);

          const swatch = (
            <Swatch
              color={value.swatch?.color}
              image={imageUrl}
              label={value.name}
              selected={isSelected}
            />
          );

          if (!isAvailable) {
            return (
              <span
                key={value.id}
                className="block cursor-not-allowed opacity-40"
                aria-label={t("unavailableVariantLabel", { name: option.name, value: value.name })}
              >
                {swatch}
              </span>
            );
          }

          return (
            <Link
              key={value.id}
              href={href}
              scroll={false}
              className="block cursor-pointer"
              aria-label={t("selectVariantLabel", { name: option.name, value: value.name })}
              onNavigate={(event) => {
                event.preventDefault();
                optimisticSelection.selectOption(selectedOptions, option.name, value.name);
              }}
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
