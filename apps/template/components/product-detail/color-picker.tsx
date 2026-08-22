import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type * as React from "react";

import { Swatch } from "@/components/ui/swatch";
import { buildOptionUrl, type SelectedOptions } from "@/lib/product";
import type { ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProductTranslator = Awaited<ReturnType<typeof getTranslations<"product">>>;

interface ColorPickerProps extends React.ComponentProps<"div"> {
  available: Set<string> | undefined;
  existing?: Set<string>;
  handle: string;
  hideImages?: boolean;
  onOptionSelect?: (name: string, value: string) => void;
  option: ProductOption;
  selectedOptions: SelectedOptions;
  selectedValue: string;
  t: ProductTranslator;
}

export function ColorPicker({
  available,
  existing,
  handle,
  hideImages,
  onOptionSelect,
  option,
  selectedOptions,
  selectedValue,
  t,
  className,
  ...props
}: ColorPickerProps) {
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;
          const exists = !existing || existing.has(value.name);
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

          if (!exists) {
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
              replace
              scroll={false}
              className={cn("block cursor-pointer", !isAvailable && "opacity-40")}
              aria-label={t("selectVariantLabel", { name: option.name, value: value.name })}
              onClick={onOptionSelect ? () => onOptionSelect(option.name, value.name) : undefined}
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
