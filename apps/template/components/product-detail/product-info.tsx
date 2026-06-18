import type * as React from "react";

import type { SelectedOptions } from "@/lib/product";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AboutItem } from "./about-item";
import { ColorPicker, type ProductTranslator } from "./color-picker";
import { OptionPicker } from "./option-picker";
import { ProductPrice } from "./product-price";

interface ProductInfoHeaderProps extends React.ComponentProps<"div"> {
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

interface ProductInfoOptionsProps extends React.ComponentProps<"div"> {
  availableValues: Map<string, Set<string>>;
  options: ProductOption[];
  selectedOptions: SelectedOptions;
  handle: string;
  t: ProductTranslator;
  hideImages?: boolean;
}

function ProductInfoOptions({
  availableValues,
  options,
  selectedOptions,
  handle,
  t,
  hideImages,
  className,
  ...props
}: ProductInfoOptionsProps) {
  const isColorOption = (opt: ProductOption) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  // Shopify emits a synthetic Title/Default Title option for products with no variant axes — hide it.
  const isShopifyDefaultOption = (opt: ProductOption) =>
    opt.name === "Title" && opt.values.length === 1 && opt.values[0]?.name === "Default Title";
  const isSingleValueOption = (opt: ProductOption) => opt.values.length === 1;

  const renderable = options.filter((opt) => !isShopifyDefaultOption(opt));
  const singleValueOptions = renderable.filter(isSingleValueOption);
  const colorOptions = renderable.filter((opt) => !isSingleValueOption(opt) && isColorOption(opt));
  const otherOptions = renderable.filter((opt) => !isSingleValueOption(opt) && !isColorOption(opt));

  if (singleValueOptions.length === 0 && colorOptions.length === 0 && otherOptions.length === 0)
    return null;

  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className="grid gap-5">
        {singleValueOptions.map((option) => (
          <p key={option.id} className="text-sm font-medium text-foreground/70">
            {option.name}: <span className="text-foreground">{option.values[0]?.name}</span>
          </p>
        ))}

        {colorOptions.map((colorOption) => (
          <ColorPicker
            key={colorOption.id}
            option={colorOption}
            selectedValue={selectedOptions[colorOption.name] ?? ""}
            available={availableValues.get(colorOption.name)}
            handle={handle}
            selectedOptions={selectedOptions}
            t={t}
            hideImages={hideImages}
          />
        ))}

        {otherOptions.map((option) => (
          <OptionPicker
            key={option.id}
            option={option}
            selectedValue={selectedOptions[option.name] ?? ""}
            available={availableValues.get(option.name)}
            handle={handle}
            selectedOptions={selectedOptions}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductInfoDescriptionProps extends React.ComponentProps<"div"> {
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
