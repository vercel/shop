import type { ComponentPropsWithoutRef } from "react";

import type { SelectedOptions } from "@/lib/product";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AboutItem } from "./about-item";
import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";
import { ProductPrice } from "./product-price";

interface ProductInfoHeaderProps extends ComponentPropsWithoutRef<"div"> {
  selectedVariant: ProductVariant | undefined;
  title: string;
  locale: string;
}

function ProductInfoHeader({
  selectedVariant,
  title,
  locale,
  className,
  ...props
}: ProductInfoHeaderProps) {
  return (
    <div data-slot="product-info-header" className={className} {...props}>
      <h1 className={cn("font-semibold text-foreground tracking-tight", "text-3xl")}>{title}</h1>

      {selectedVariant && (
        <ProductPrice
          amount={selectedVariant.price.amount}
          currencyCode={selectedVariant.price.currencyCode}
          compareAtAmount={selectedVariant.compareAtPrice?.amount}
          locale={locale}
        />
      )}
    </div>
  );
}

interface ProductInfoOptionsProps extends ComponentPropsWithoutRef<"div"> {
  variants: ProductVariant[];
  options: ProductOption[];
  selectedOptions: SelectedOptions;
  handle: string;
  hideImages?: boolean;
}

function ProductInfoOptions({
  variants,
  options,
  selectedOptions,
  handle,
  hideImages,
  className,
  ...props
}: ProductInfoOptionsProps) {
  // Separate color/swatch options from other options.
  const isColorOption = (opt: ProductOption) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  const isDefaultOption = (opt: { values: { name: string }[] }) => opt.values.length === 1;

  const colorOptions = options.filter((opt) => isColorOption(opt) && !isDefaultOption(opt));
  const otherOptions = options.filter((opt) => !isColorOption(opt) && !isDefaultOption(opt));

  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className="grid gap-10">
        {/* Color Pickers (with images or swatches) */}
        {colorOptions.map((colorOption) => (
          <ColorPicker
            key={colorOption.id}
            option={colorOption}
            selectedValue={selectedOptions[colorOption.name] ?? ""}
            variants={variants}
            handle={handle}
            selectedOptions={selectedOptions}
            hideImages={hideImages}
          />
        ))}

        {/* Other Options (text buttons) */}
        {otherOptions.map((option) => (
          <OptionPicker
            key={option.id}
            option={option}
            selectedValue={selectedOptions[option.name] ?? ""}
            variants={variants}
            handle={handle}
            selectedOptions={selectedOptions}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductInfoDescriptionProps extends ComponentPropsWithoutRef<"div"> {
  descriptionHtml: string;
}

function ProductInfoDescription({
  descriptionHtml,
  className,
  ...props
}: ProductInfoDescriptionProps) {
  if (!descriptionHtml) return null;
  return (
    <div data-slot="product-info-description" className={className} {...props}>
      <AboutItem descriptionHtml={descriptionHtml} />
    </div>
  );
}

export { ProductInfoDescription, ProductInfoHeader, ProductInfoOptions };
