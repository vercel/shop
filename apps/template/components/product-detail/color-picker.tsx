import Link from "next/link";
import type * as React from "react";

import { Swatch } from "@/components/ui/swatch";
import type { OptionGroupState } from "@/lib/product";
import { cn } from "@/lib/utils";

export type ProductTranslator = (
  key: "selectVariantLabel" | "unavailableVariantLabel",
  values: { name: string; value: string },
) => string;

interface ColorPickerProps extends React.ComponentProps<"div"> {
  hideImages?: boolean;
  onSelectValue?: (optionName: string, value: string) => void;
  option: OptionGroupState;
  t: ProductTranslator;
}

export function ColorPicker({
  hideImages,
  onSelectValue,
  option,
  t,
  className,
  ...props
}: ColorPickerProps) {
  const selectedValue = option.values.find((value) => value.selected)?.name ?? "";
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {option.values.map((value) => {
          const imageUrl = hideImages
            ? undefined
            : value.swatch?.image || (value.swatch?.color ? undefined : value.image);

          const swatch = (
            <Swatch
              color={value.swatch?.color}
              image={imageUrl}
              label={value.name}
              selected={value.selected}
            />
          );

          if (!value.exists || !value.available) {
            return (
              <span
                key={value.name}
                className="block cursor-not-allowed opacity-40"
                aria-label={t("unavailableVariantLabel", { name: option.name, value: value.name })}
              >
                {swatch}
              </span>
            );
          }

          return (
            <Link
              key={value.name}
              href={value.href}
              scroll={false}
              className="block cursor-pointer"
              aria-label={t("selectVariantLabel", { name: option.name, value: value.name })}
              aria-current={value.selected ? "true" : undefined}
              onClick={
                onSelectValue && !value.crossProduct
                  ? (event) => {
                      event.preventDefault();
                      onSelectValue(option.name, value.name);
                    }
                  : undefined
              }
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
