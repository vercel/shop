import type { ComponentPropsWithoutRef } from "react";

import { DEFAULT_OPTION } from "@/lib/constants";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AboutItem } from "./about-item";
import { OptionPicker } from "./option-picker";
import { ProductPrice } from "./product-price";
import type { SelectedOptions } from "./variants";

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
      <h1
        className={cn(
          "font-semibold text-foreground tracking-tight",
          "text-3xl",
        )}
      >
        {title}
      </h1>

      {selectedVariant && (
        <ProductPrice
          amount={selectedVariant.price.amount}
          currencyCode={selectedVariant.price.currencyCode}
          compareAtAmount={selectedVariant.compareAtPrice?.amount}
          locale={locale}
          className="mt-3"
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
}

function ProductInfoOptions({
  variants,
  options,
  selectedOptions,
  handle,
  className,
  ...props
}: ProductInfoOptionsProps) {
  const isDefaultOption = (opt: { values: { name: string }[] }) =>
    opt.values.length === 1 && opt.values[0].name === DEFAULT_OPTION;

  const visibleOptions = options.filter((opt) => !isDefaultOption(opt));

  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className="space-y-8">
        {visibleOptions.map((option) => (
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

export { ProductInfoHeader, ProductInfoOptions, ProductInfoDescription };
