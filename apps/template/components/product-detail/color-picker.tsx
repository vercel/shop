import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

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
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-2.5">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;

          const isAvailable = !available || available.has(value.name);

          const imageUrl = hideImages ? undefined : value.swatch?.image || value.image;

          const href = buildOptionUrl(handle, selectedOptions, option.name, value.name);

          const swatch = (
            <div
              className={cn(
                "relative aspect-square w-full rounded-lg transition-all overflow-hidden",
                "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:inset-ring after:inset-ring-foreground/10",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={200}
                  height={200}
                  alt={t("swatchAlt", { value: value.name })}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  className="size-full bg-accent"
                  style={value.swatch?.color ? { backgroundColor: value.swatch.color } : undefined}
                />
              )}
            </div>
          );

          if (!isAvailable) {
            return (
              <span
                key={value.id}
                className="block opacity-40 cursor-not-allowed"
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
              className="block"
              aria-label={t("selectVariantLabel", { name: option.name, value: value.name })}
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
